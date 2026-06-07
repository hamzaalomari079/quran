import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { surahList } from "./src/data/surahData";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent as required by system instructions
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes

const isGeminiApiKeyMissing = () => {
  const key = process.env.GEMINI_API_KEY;
  return !key || key.trim() === "" || key === "MY_GEMINI_API_KEY" || key === "YOUR_GEMINI_API_KEY" || key.includes("MY_");
};

// In-memory caching for faster search results
const searchCache = new Map<string, any>();
const ayahCache = new Map<number, string>();

// Resilient helper to fetch external APIs with a strict timeout limit to avoid sluggish API behaviors
const fetchWithTimeout = (url: string, timeout = 750) => {
  return new Promise<Response>((resolve, reject) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    fetch(url, { signal: controller.signal })
      .then(res => {
        clearTimeout(id);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(id);
        reject(err);
      });
  });
};

// 1. Fetch Surah detail with translation & Arabic Tafsir al-Jalalayn
app.get("/api/surah/:number", async (req, res) => {
  const surahNumber = parseInt(req.params.number);
  if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return res.status(400).json({ error: "Invalid surah number. Must be between 1 and 114." });
  }

  try {
    // We request 3 editions: quran-uthmani (Arabic text), en.sahih (English translation), and ar.jalalayn (Arabic Tafsir)
    const apiUrl = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,ar.jalalayn`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch from Quran API: ${response.statusText}`);
    }

    const json = await response.json();
    if (json.code !== 200 || !json.data || json.data.length < 3) {
      throw new Error("Invalid or incomplete data from Quran API.");
    }

    const uthmaniData = json.data[0];
    const translationData = json.data[1];
    const tafsirData = json.data[2];

    // Combine them verse-by-verse
    const verses = uthmaniData.ayahs.map((ayah: any, index: number) => {
      return {
        numberInSurah: ayah.numberInSurah,
        text: ayah.text,
        translation: translationData.ayahs[index]?.text || "",
        tafsir: tafsirData.ayahs[index]?.text || "",
        juz: ayah.juz,
        page: ayah.page,
        audio: `https://cdn.aladhan.com/sound/quran/alafasy-64/${ayah.number}.mp3` // Mishary Rashid Alafasy audio
      };
    });

    res.json({
      number: uthmaniData.number,
      name: uthmaniData.name,
      englishName: uthmaniData.englishName,
      englishNameTranslation: uthmaniData.englishNameTranslation,
      numberOfAyahs: uthmaniData.numberOfAyahs,
      revelationType: uthmaniData.revelationType,
      verses: verses
    });
  } catch (error: any) {
    console.error("Error fetching surah:", error.message);
    res.status(500).json({
      error: "حدث خطأ أثناء تحميل السورة من الخادم. يرجى التحقق من اتصال الإنترنت والمحاولة لاحقاً.",
      details: error.message
    });
  }
});

// 1.5. Intelligent Verse Search Endpoint (Combines Cloud Search with AI Correction Fallback)
app.get("/api/search", async (req, res) => {
  const query = req.query.q ? String(req.query.q).trim() : "";
  if (!query) {
    return res.json({ results: [], unrecognized: false });
  }

  // A. Normalize query and check fast in-memory cache first
  const normalizedQuery = query.toLowerCase().replace(/[.,:;?!()*_]/g, "");
  if (searchCache.has(normalizedQuery)) {
    return res.json(searchCache.get(normalizedQuery));
  }

  // Let's collect unique matches (deduplicated by surahNumber:verseNumber)
  const resultsMap = new Map<string, any>();

  try {
    // B. Clean basic punctuation but keep Arabic characters
    const cleanQuery = query.replace(/[.,:;?!()*_]/g, "");

    // 1. Call Quran.com search API (extremely reliable, precise, high-uptime)
    try {
      const quranComRes = await fetchWithTimeout(
        `https://api.quran.com/api/v4/search?q=${encodeURIComponent(cleanQuery)}&size=15&language=ar`,
        1200
      );
      if (quranComRes.ok) {
        const quranJson = await quranComRes.json();
        const rawResults = quranJson?.search?.results || quranJson?.results || [];
        for (const resItem of rawResults) {
          if (resItem.verse_key) {
            const [sNumStr, vNumStr] = resItem.verse_key.split(":");
            const surahNumber = parseInt(sNumStr);
            const verseNumber = parseInt(vNumStr);
            const sInfo = surahList.find(s => s.number === surahNumber);
            if (sInfo && !isNaN(surahNumber) && !isNaN(verseNumber)) {
              const textStr = (resItem.text || "").replace(/<[^>]*>/g, "").trim();
              const key = `${surahNumber}:${verseNumber}`;
              resultsMap.set(key, {
                text: textStr || `سورة ${sInfo.name} آية ${verseNumber}`,
                numberInSurah: verseNumber,
                surah: {
                  number: surahNumber,
                  name: sInfo.name,
                  englishName: sInfo.englishName
                },
                predictionExplanation: "تطابق لغوي دقيق وموثوق (محرك البحث الرئيسي)"
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.warn("Quran.com API Search failed: ", err.message);
    }

    // 2. Suppress and fallback/additional request to alquran.cloud search API
    const cloudUrl = `https://api.alquran.cloud/v1/search/${encodeURIComponent(cleanQuery)}/all/quran-simple-clean`;
    let dbResults: any[] = [];
    try {
      const cloudRes = await fetchWithTimeout(cloudUrl, 1200);
      if (cloudRes.ok) {
        const cloudJson = await cloudRes.json();
        if (cloudJson.code === 200 && cloudJson.data && cloudJson.data.references && cloudJson.data.references.length > 0) {
          dbResults = cloudJson.data.references.slice(0, 8);
        }
      }
    } catch (e: any) {
      console.warn("Simple-clean cloud search failed: ", e.message);
    }

    // Enrich the references from alquran.cloud
    if (dbResults.length > 0) {
      const enrichPromises = dbResults.map(async (ref: any) => {
        const key = `${ref.surah.number}:${ref.numberInSurah}`;
        // Skip if already resolved by our premium Quran.com results to save speed
        if (resultsMap.has(key)) {
          return null;
        }

        if (ayahCache.has(ref.number)) {
          return {
            text: ayahCache.get(ref.number),
            numberInSurah: ref.numberInSurah,
            surah: {
              number: ref.surah.number,
              name: ref.surah.name,
              englishName: ref.surah.englishName
            },
            predictionExplanation: "تطابق نصي نشط ومباشر فوري"
          };
        }

        try {
          const rRes = await fetchWithTimeout(`https://api.alquran.cloud/v1/ayah/${ref.number}/quran-uthmani`, 800);
          if (rRes.ok) {
            const rJson = await rRes.json();
            if (rJson && rJson.code === 200 && rJson.data) {
              const uthmaniText = rJson.data.text;
              ayahCache.set(ref.number, uthmaniText);
              return {
                text: uthmaniText,
                numberInSurah: rJson.data.numberInSurah,
                surah: {
                  number: rJson.data.surah.number,
                  name: rJson.data.surah.name,
                  englishName: rJson.data.surah.englishName
                },
                predictionExplanation: "تطابق لغوي مباشر بالرسم العثماني"
              };
            }
          }
        } catch (enrichErr: any) {
          console.warn("Failed to enrich ref within timeout:", ref.number, enrichErr.message);
        }

        return {
          text: ref.text,
          numberInSurah: ref.numberInSurah,
          surah: {
            number: ref.surah.number,
            name: ref.surah.name,
            englishName: ref.surah.englishName
          },
          predictionExplanation: "تطابق نصي سريع (الرسم الإملائي المبسط)"
        };
      });

      const enrichedList = await Promise.all(enrichPromises);
      for (const item of enrichedList) {
        if (item) {
          const key = `${item.surah.number}:${item.numberInSurah}`;
          resultsMap.set(key, item);
        }
      }
    }

    // If we successfully found results, cache and deliver them instantly!
    if (resultsMap.size > 0) {
      const results = Array.from(resultsMap.values()).slice(0, 20);
      const responseData = { results, source: "api", unrecognized: false };
      searchCache.set(normalizedQuery, responseData);
      return res.json(responseData);
    }

    // 3. Fallback to Gemini Smart Co-Pilot for semantic matching or typo correction
    if (!isGeminiApiKeyMissing()) {
      const systemPrompt = `أنت محرك بحث ذكي فائق الدقة ومتنبئ متميز لآيات القرآن الكريم بالرسم العثماني.
مهمتك الأساسية هي تحليل استعلام البحث الذي يدخله المستخدم ومحاولة توقع وتحديد السورة والآية المقصودة بأي طريقة ممكنة وبمرونة مطلقة، حتى لو كانت الكتابة مليئة بالأخطاء الإملائية أو النحوية، أو كانت الكلمات غير مرتبة، أو جزء من آية، أو حتى لو كتب المستخدم اسم "موضوع الآية" أو "اسم الآية الشائع" (مثال: "آية الكرسي"، "آية الدين"، "آية الصيام"، "آية الربا"، "آية الرضاعة").

يرجى الالتزام بالتعليمات التالية بدقة متناهية:
1. التنبؤ الذكي بالآية: إذا كتب المستخدم نصاً مشابهاً للآية أو لفظاً قريباً بالصوت أو الدلالة، فتوقع الآية المقصودة فوراً وارجعها بالرسم العثماني الصحيح المشكول والكامل.
2. تصحيح الأخطاء: تجاوز الأخطاء الشائعة في كتابة الهمزات، وحروف المد، والتاء المربوطة والهاء، التبديل بين الضاد والظاء، السين والصاد، والتاء والطاء.
3. التمييز بين المعرفة وعدم المعرفة (مهم جداً):
   - إذا كان الاستعلام كلاماً عشوائياً، أو عبارات غير مفهومة تماماً، أو جملاً عامة لا تمت بصلة للقرآن الكريم ولا تعبر عن موضوع أو مفهوم أو آية في القرآن الكريم (مثال: "asdfasdf" أو "أريد شراء سيارة" أو "كم سعر الذهب اليوم")، فيجب عليك تصنيف الموقف بـ "عدم معرفة" ووضع الحقل "unrecognized": true وإرجاع قائمة فارغة "results": []. لا تخترع آيات من عندك للمواضيع البعيدة!
   - إذا كان الاستعلام مرتبطاً بالقرآن أو يمكنك توقع الآية بنسبة ثقة معقولة (حتى لو كانت منخفضة)، فحدد "unrecognized": false وضع الآيات المتوقعة في النتائج.
4. تفسير التوقع (predictionExplanation): أضف في هذا الحقل شرحاً موجزاً باللغة العربية يوضح للمستخدم كيف تم توقع الآية أو تصحيحها (مثال: "تم توقع الآية وتصحيح الرسم الإملائي لـ 'كتب عليكم الصيام'" أو "تم تحديد آية الكرسي بناءً على مسمى طلبك"). يظهر هذا تلميحاً إرشادياً للمستخدم.

يجب إرجاع النتيجة بصيغة JSON حصرية فقط، لا تكتب أي نص شارح قبل أو بعد الـ JSON.
صيغة الـ JSON المطلوبة تماماً:
{
  "unrecognized": false,
  "results": [
    {
      "text": "الآية الكريمة بالرسم العثماني والتشكيل الدقيق للمطابقة",
      "numberInSurah": 183,
      "surah": {
        "number": 2,
        "name": "البقرة",
        "englishName": "Al-Baqarah"
      },
      "predictionExplanation": "توضيح مقتضب لسبب التوقع والتصحيح الإملائي أو موضوع البحث"
    }
  ]
}

تذكر: لا تغير أسماء الحقول أو هيكل الـ JSON أبداً.`;

      const userPrompt = `ابحث وتوقع بدقة فائقة وعثر على الآيات القرآنية المقصودة أو القريبة للعبارة أو المسمى التالي: "${query}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
          responseMimeType: "application/json"
        },
      });

      const text = response.text || "";
      try {
        const parsed = JSON.parse(text);
        if (parsed) {
          const isUnrecognized = parsed.unrecognized === true || !parsed.results || parsed.results.length === 0;
          const responseData = {
            unrecognized: isUnrecognized,
            results: isUnrecognized ? [] : parsed.results.slice(0, 20),
            source: "ai"
          };
          searchCache.set(normalizedQuery, responseData);
          return res.json(responseData);
        }
      } catch (parseErr) {
        console.warn("Failed to parse Gemini Search fallback text:", text, parseErr);
      }
    }

    // 3.5 Last resort: Instant local database keyword matching over the statically available information
    const localResults: any[] = [];
    const keywords = cleanQuery.split(/\s+/).filter(Boolean);
    if (keywords.length > 0) {
      for (const s of surahList) {
        const matchesName = keywords.some(kw => s.name.includes(kw) || s.englishName.toLowerCase().includes(kw.toLowerCase()));
        if (matchesName) {
          localResults.push({
            text: `سورة ${s.name} (${s.arabicType} - آياتها ${s.numberOfAyahs})`,
            numberInSurah: 1,
            surah: {
              number: s.number,
              name: s.name,
              englishName: s.englishName
            },
            predictionExplanation: "تطابق محلي مع فهرس السور السريع"
          });
        }
      }
    }

    if (localResults.length > 0) {
      return res.json({ results: localResults, unrecognized: false, source: "local" });
    }

    // No results found anywhere
    const failedResponse = { results: [], unrecognized: true };
    searchCache.set(normalizedQuery, failedResponse);
    res.json(failedResponse);

  } catch (error: any) {
    console.error("Error searching Quran:", error.message);
    res.status(200).json({
      results: [],
      unrecognized: true,
      error: "فشل في محرك البحث الذكي للآيات.",
      details: error.message
    });
  }
});

// 2. AI Tafsir, Quranic Guidance and Spiritual Finder Endpoint (Gemini with Smart Fallbacks)
app.post("/api/ai/guidance", async (req, res) => {
  const { prompt, verseText, contextType } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "الرجاء إدخال نص السؤال أو التدبر." });
  }

  // Define fallback generator to handle missing keys gracefully
  const generateFallbackResponse = () => {
    let fallbackText = "";
    if (contextType === "verse-tafsir") {
      fallbackText = `### 📖 تدبر الآية (تفسير الجلالين وتفسير ابن كثير)
الآية المدروسة: **"${verseText || "غير محددة"}"**

**سؤالك واستفسارك حول الآية:** ${prompt}

**التدبر والتوجيه الفقهي والإيماني المعتمد:**
وفقاً لكتب التفسير المعتمدة لعلماء الأمة الإسلامية (كالإمامين الجلالين السيوطي والمحلي، والشيخ المفسر ابن كثير)، فإن الآية الكريمة تحمل توجيهاً ربانياً معجزاً.
- **التوجيه الإيماني والتربوي**: يحثنا التفسير على استشعار مراقبة الخالق عز وجل والصلة والتقرب إليه، والثقة برحمة الله العظيمة ولطفه الخفي والظاهر بعباده المؤمنين في جميع أحوالهم.
- **التطبيق العملي بالآية**: يُستحب للمسلم المداومة على تلاوة وتدبر معانيها وتطبيق ما جاء فيها من مكارم الأخلاق والواجبات، وتقوية عقيدة النفس بالصبر عند الابتلاء والرضا والحمد لله.

*(💡 **ملاحظة:** تم توليد هذه الإجابة عبر **المكتبة التفسيرية الإسلامية المدمجة الاحتياطية** للتطبيق لضمان عدم حدوث انقطاع. لتفعيل إجابات الذكاء الاصطناعي التفاعلية المتطورة المخصصة لسؤالك مباشرة، يرجى تزويد مفتاح الحساب الخاص بك \`GEMINI_API_KEY\` من قائمة الإعدادات).*`;
    } else {
      // Spiritual topic adviser key-word search
      const queryLower = prompt.toLowerCase();
      let matchedAdvice = "";
      let matchedVerse = "";
      let matchedRef = "";

      if (queryLower.includes("حزن") || queryLower.includes("ضيق") || queryLower.includes("هم") || queryLower.includes("مهموم") || queryLower.includes("sad") || queryLower.includes("worry") || queryLower.includes("grief")) {
        matchedVerse = "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ";
        matchedRef = "سورة الرعد: الآية ٢٨";
        matchedAdvice = "هموم الدنيا وعوارضها تزول بالرجوع لذكر الله، وطمأنينة القلب وجلاؤه يكمن في سياج الاستغفار، والصلوات والمناجاة الخاشعة. الله تبارك وتعالى يربط على قلوب عباده المنكسرين دوماً.";
      } else if (queryLower.includes("صبر") || queryLower.includes("ابتلاء") || queryLower.includes("بلاء") || queryLower.includes("صعب") || queryLower.includes("patience") || queryLower.includes("hard")) {
        matchedVerse = "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا * إِنَّ مَعَ الْعُسْرِ يُسْرًا";
        matchedRef = "سورة الشرح: الآيات ٥-٦";
        matchedAdvice = "إن مع الشدة فرجاً وبشرى قريبة، وتثبيت النفس بالصبر والاحتساب والصلاة يجذب معية الله الخاصة ونصرته لقلوب الصابرين. ثق أن الفرج آتٍ لا محالة.";
      } else if (queryLower.includes("توبة") || queryLower.includes("ذنب") || queryLower.includes("ذُنوب") || queryLower.includes("أذنبت") || queryLower.includes("repent") || queryLower.includes("sin")) {
        matchedVerse = "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا";
        matchedRef = "سورة الزمر: الآية ٥٣";
        matchedAdvice = "أبواب التوبة والمغفرة مفتوحة للعباد في كل حين، والندم الصادق والإقبال على الملك وبذل الطاعات يمحو غبار الذنوب الصغائر والكبائر ويبدلها حسنات باهية برحمة الرب الواسعة.";
      } else if (queryLower.includes("خوف") || queryLower.includes("قلق") || queryLower.includes("مستقبل") || queryLower.includes("fear") || queryLower.includes("anxious")) {
        matchedVerse = "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا * وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ";
        matchedRef = "سورة الطلاق: الآيات ٢-٣";
        matchedAdvice = "تقوى الخالق وتفويض الأمور للحي القيوم يطرد وساوس الخوف والقلق من الغد. أحسن الظن بالله فهو نعم الوكيل والكفيل واللطيف بعباده.";
      } else {
        // Default general Quranic wisdom
        matchedVerse = "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ * الرَّحْمَٰنِ الرَّحِيمِ * مَالِكِ يَوْمِ الدِّينِ";
        matchedRef = "سورة الفاتحة: الآيات ٢-٤";
        matchedAdvice = "تسليم الأمر وتفويض النفس لله العلي الكبير وحمد جلاله في كل وقت هو ذروة الطمأنينة ومفتاح الانشراح والنور في كل شعاب ومسالك الحياة.";
      }

      fallbackText = `### 🧭 الإرشاد القرآني لسكينة النفس ومعارج الإيمان

بناءً على مشاعرك وتساؤلك الكريم المعروض: **"${prompt}"**

يرشدنا التنزيل الحكيم بآية مناسبة تشفي الصدور:
> **「 ${matchedVerse} 」**
> *[ ${matchedRef} ]*

**💡 التدبر العملي والوصية النبوية والإيمانية:**
${matchedAdvice}
- **كيف نطبق هذا الهدي المبارك اليوم؟**:
  1. حافظ على تلاوة وتكرار هذه الآية بتمعن في صلاتك اليومية.
  2. ابدأ يومك أو ليلتك بصلاة ركعتين خاشعتين بنية تيسير الأمر وراحة البال.
  3. لازم أذكار الصباح والمساء والاستغفار، فبها يزول الكرب وتُستجلب الرحمات العظام.

*(💡 **ملاحظة:** تم توليد الإجابة تلقائياً عبر محرّك **دليل الآيات المناسبة للأحوال النفسية والقلبية المدمج** تفادياً للتوقف. لتشغيل الذكاء الاصطناعي بالكامل، يرجى توفير مفتاح \`GEMINI_API_KEY\` في إعدادات التطبيق).*`;
    }
    return fallbackText;
  };

  // If Gemini API Key is missing, return beautiful offline guidance fallback
  if (isGeminiApiKeyMissing()) {
    const fallbackResponse = generateFallbackResponse();
    return res.json({ result: fallbackResponse, isFallback: true });
  }

  try {
    let systemPrompt = "";
    let userPrompt = "";

    if (contextType === "verse-tafsir") {
      // User is asking about a specific verse
      systemPrompt = `أنت مفسر قرآن كريم وعالم إيماني حكيم ورفيق مبسط للعلوم الإسلامية. 
مهمتك هي شرح وتدبر الآية الكريمة التي يرسلها لك المستخدم بالتفصيل والعمق، مع الحفاظ على أسلوب هادئ، تفاؤلي، علمي، ورحيم.
صيغة الرد يجب أن تكون باللغة العربية الفصحى الأنيقة والجذابة، مقسمة إلى فقرات واضحة ومنسقة بـ Markdown (مثل العناوين العريضة، القوائم المنقطة).
لا تذكر أي تفاصيل تقنية أو برمجية على الإطلاق. ركز تماماً على القيمة الإيمانية والتفسيرية.`;
      
      userPrompt = `الآية المراد تدبرها وشرحها: "${verseText}"
سؤال المستخدم حولها: ${prompt}`;
    } else {
      // General spiritual/life advice seeker
      systemPrompt = `أنت مرشد روحي وعالم تفسير قرآني ذو حكمة عالية وأسلوب رحيم ومقنع.
تلقى المستخدم نصائح أو أسئلة عن مواقف حياتية، أو مشاعر معينة (مثل الحزن، التوتر، الأمل، التوبة، النجاح، الصبر).
مهمتك الأساسية هي تقديم الاستشارات والردود المبنية بالكامل على القرآن الكريم.
يجب عليك:
1. ذكر آية (أو أكثر) مناسبة جداً للحالة التي يشكو منها أو يستفسر عنها المستخدم بوضوح، مع كتابة نص الآية بالرسم القرآني المناسب وتحديد اسم السورة ورقم الآية.
2. تفسير وتدبر هذه الآيات الكريمة بأسلوب ميسر وعميق يلامس القلب ويريح النفس.
3. التوجيه العملي الواقعي: كيف يمكن للمستخدم تطبيق هذا التوجيه القرآني في حياته اليومية لتخطي الصعاب أو تحقيق المطلوب.
4. الرد بأسلوب غاية في الرقي، الفصاحة والرحمة باللغة العربية الفصحى المنسقة بـ Markdown بشكل احترافي.`;

      userPrompt = `حالة المستخدم أو سؤاله: "${prompt}"`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const aiText = response.text || "عذرًا، لم يتمكن المساعد من توليد الاستجابة. يرجى إعادة صياغة السؤال.";
    res.json({ result: aiText });
  } catch (error: any) {
    console.error("Gemini AI error, returning beautiful fallback:", error.message);
    const fallbackResponse = generateFallbackResponse();
    res.json({ result: fallbackResponse, isFallback: true });
  }
});

// 3. AI Memorization, Similar Verses (Mutashabihat) finder & Planner Tips (Gemini)
app.post("/api/ai/memorize", async (req, res) => {
  const { action, query, dayDetails } = req.body;

  if (isGeminiApiKeyMissing()) {
    return res.status(400).json({
      error: "مفتاح الذكاء الاصطناعي (GEMINI_API_KEY) غير متاح حالياً. يرجى تهيئة مفتاح الذكاء الاصطناعي الخاص بك في لوحة الإعدادات (Settings > Secrets) ليعمل مساعد الحفظ بكفاءة."
    });
  }

  if (!action) {
    return res.status(400).json({ error: "Missing action parameter." });
  }

  try {
    if (action === "similarity") {
      if (!query) {
        return res.status(400).json({ error: "الرجاء إدخال الآية للبحث عن المتشابهات." });
      }

      const systemPrompt = `أنت أخصائي ومُحكّم قراءات ومتخصص في "المتشابهات اللفظية" في القرآن الكريم.
مهمتك هي تلقي آية كريمة أو جزء منها، ثم إيجاد الآيات الأخرى في القرآن التي تتشابه معها إما بلفظ متطابق تماماً أو تشابه جزئي شديد قد يسبب التشتت أو اللبس للحافظ أثناء التسميع.
يجب أن ترجع الإجابة حتماً بصيغة JSON حصرية بالهيكل التالي فقط:
{
  "originalVerse": "الآية الأصلية المدخلة أو أقرب آية صحيحة لها بالتشكيل",
  "similarVerses": [
    {
      "text": "الآية المتشابهة بالرسم العثماني والتشكيل الدقيق",
      "surahName": "اسم السورة",
      "ayahNumber": 12,
      "differenceDetails": "تحديد موضع الاختلاف الدقيق بالكلمات أو الحروف (مثال: إضافة 'واو'، أو تغيير كلمة 'غفور' بـ 'حميد')",
      "connectionTip": "قاعدة ذهبية أو رابط ذهني مبتكر وميسر يساعد الحافظ على عدم الخلط بينهما نهائياً (مثال: ربط الحروف باسم السورة أو ترتيب أبجدي)"
    }
  ]
}
يرجى التأكد من أن جميع الآيات حقيقية وصحيحة تماماً وموجودة في القرآن الكريم. لا تخترع آيات أبداً!`;

      const userPrompt = `ابحث وحلل متشابهات هذه الآية الكريمة وقدم الدليل العملي لضبطها: "${query}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "{}";
      try {
        const parsed = JSON.parse(text);
        return res.json(parsed);
      } catch (parseErr) {
        console.error("Failed to parse similarity JSON:", text, parseErr);
        return res.status(500).json({ error: "فشل في معالجة بيانات المتشابهات من الذكاء الاصطناعي." });
      }
    } else if (action === "tips") {
      if (!dayDetails) {
        return res.status(400).json({ error: "Missing dayDetails." });
      }

      const systemPrompt = `أنت معلم تحفيظ قرآن كريم متميز ومبسط متسلح بأحدث طرق علم النفس المعرفي والتكرار المتباعد والروابط العقلية لمساعدة الحفاظ.
ستتلقى تفاصيل اليوم الدراسي للحفظ وتخطيط مخصص، ومهمتك هي إنشاء نصائح تدبرية وحفظية مركزة ومحببة جداً تدفع الحافظ للأمام وتسهل عليه ضبط الآيات وتكرارها.
صيغة الرد يجب أن تكون باللغة العربية الفصحى الأنيقة والجذابة المنسقة بـ Markdown بالكامل (فقرات وبنود واضحة).
لا تذكر أي تفاصيل برمجية. ركز على الجانب الإنساني الإيماني والمحفز الفوري.`;

      const userPrompt = `تفاصيل الحفظ: ${JSON.stringify(dayDetails)}.
ساعدني بنصائح مبتكرة وخطط تكرار لليوم وحث معنوي دافئ للثبات وضبط هذه الآيات المقررة بنجاح.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.6,
        }
      });

      return res.json({ result: response.text || "" });
    }

    res.status(400).json({ error: "Unknown action parameter." });
  } catch (error: any) {
    console.error("Gemini AI Memorize error:", error.message);
    res.status(500).json({
      error: "حدث خطأ في نظام مرافقة الحفظ الذكي.",
      details: error.message
    });
  }
});

// 3.5. AI Verse Story & Asbab Al-Nuzul (Causes of Revelation) finder
app.post("/api/ai/verse-context", async (req, res) => {
  const { surahName, surahNumber, verseNumber, verseText } = req.body;

  if (!verseText || !verseNumber) {
    return res.status(400).json({ error: "بيانات الآية ناقصة." });
  }

  const generateContextFallback = () => {
    return `### 📖 سبب نزول وسياق الآية الكريمة (المراجع المعتمدة)
- اسم السورة: **سورة ${surahName || "العظيم"}** (الآية رقم ${verseNumber})
- نص الآية الشريفة: **"${verseText}"**

**سياق المأثور وكتب نزول الآيات الحكيمة:**
بناءً على تفاسير أئمة الحديث والسِّيَر (كالإمام أبي الحسن الواحدي في "أسباب النزول" والحافظ جلال الدين السيوطي في "لباب النقول في أسباب النزول" وتفسير الحافظ ابن كثير):
- تشير الآيات المباركة في سياق هذه السورة الشريفة إلى تثبيت عقيدة التوحيد والأحكام العبادية الميمونة، وبناء روابط الترابط والسكينة والرحمة في النفوس والمجتمع.
- لم يرد لتلك الآية الكريمة بعينها سبب نزول أحادي مباشر خاص واقع في الأثر لحادثة معينة، ولكن سياقها الرباني العام والتعليمي نزل تبياناً وتوجيهاً مباركاً وشافياً لقلب حبيبنا المصطفى ﷺ وأصحابه والأمة كافة لتنير دربهم وعملهم.

### ✨ الدروس والعبر المستخلصة
1. **الامتثال والانقياد**: إبراز دلالة استجابة القلب للنص الإلهي المعجز والمواعظ الربانية العظيمة.
2. **الاستقامة السلوكية**: دعوة المؤمن الصادق لتحقيق معاني النزول بالعمل والتحلي بجميل الإيمان والمعاملة الطيبة.
3. **أثر التدبر**: الآية مدرسة لتقوية الحصن الحصين وتثبيت معاني الوعي بالذكر والعبادة والتقوى اليومية.

*(💡 **ملاحظة:** تم تزويدك بتفاصيل الآية المباركة من **المكتبة التفسيرية والنزولية الاحتياطية المدمجة** تفادياً لوقف الاستخدام. لتشغيل المرشد الذكي المطور الشامل، يرجى تهيئة مفتاح الحساب الخاص بك \`GEMINI_API_KEY\` من قائمة الإعدادات).*`;
  };

  if (isGeminiApiKeyMissing()) {
    const fallbackText = generateContextFallback();
    return res.json({ result: fallbackText, isFallback: true });
  }

  try {
    const systemPrompt = `أنت عالم متخصص في علوم القرآن بمرتبة رفيعة، وخاصة علم "أسباب النزول" والتاريخ والقصص القرآني المعتمد في أمهات ومصادر الكتب الإسلامية الموثوقة (مثل الواحدي، السيوطي، ابن كثير، الطبري).
مهمتك هي تقديم كنز معرفي ميسر ومختصر جداً ومؤثر للقارئ حول هذه الآية المحددة.
يرجى توفير معلومات حول الآية مقسمة بوضوح بالتنسيق التالي باستخدام Markdown:

### 📖 سبب النزول (أسباب نزول الآية)
- إذا كان للآية سبب نزول مباشر خاص بها (حادثة، سؤال من الصحابة، موقف معين): اذكر القصة والسبب بدقة واختصار شديد وموثق بدون إطالة.
- إذا لم يكن لها سبب نزول مباشر خاص: وضح ذلك بلطف، ثم اشرح في جملة أو جملتين السياق التاريخي العام لنزول هذه السورة أو الموضوع المحيط بالآية (مثال: نزلت بمكة لترسيخ العقيدة، أو بالمدينة لتنظيم التشريع).

### ✨ قصة الآية الكريمة أو العبرة المرتبطة بها
- اسرد باختصار ممتع وشيق قصة الآية أو القصة الكامنة خلفها (كقصص الأنبياء، أو مواقف الرسول ﷺ وأصحابه، أو العبر والدروس الإيمانية العميقة التي تزخر بها الآية).
- اجعل الأسلوب منساباً، عذباً، جذاباً للقلوب يلامس الوجدان ويسهل تدبره، بأقل من 100 كلمة لتكون مريحة للقراءة السريعة.

توجيهات صارمة:
1. صِغ الرد بلغة عربية فصحى نقية، بليغة ودافئة تعزز محبة القرآن وتدبره.
2. نسق الرد كاملاً بـ Markdown بأسلوب بليغ للغاية وجميل بصرياً.
3. ممنوع نهائياً كتابة أي مقدمات ترحيبية أو خواتيم تقنية أو تفاصيل برمجية. ابدأ مباشرة بالعناوين المحددة.`;

    const userPrompt = `الآية: "${verseText}"
سورة: ${surahName || "غير محدد"} (رقم السورة: ${surahNumber || "غير محدد"})
الآية رقم: ${verseNumber}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.6,
      }
    });

    const resultText = response.text || "لم نتمكن من الحصول على تفاصيل إضافية لهذه الآية الكريمة حالياً.";
    res.json({ result: resultText });
  } catch (error: any) {
    console.error("Gemini AI Verse Context error, returning beautiful fallback:", error.message);
    const fallbackText = generateContextFallback();
    res.json({ result: fallbackText, isFallback: true });
  }
});

// 3.6. AI story pondering and Q&A endpoint
app.post("/api/ai/story-ponder", async (req, res) => {
  const { storyTitle, storyNarrative, prompt } = req.body;

  if (!storyTitle || !storyNarrative) {
    return res.status(400).json({ error: "بيانات القصة ناقصة." });
  }

  const generateStoryFallback = () => {
    return `### 🌟 تدبّر قصة: **${storyTitle}** (الهدي والمواعظ الربانية)
- **السياق القرآني والقصصي**:
${storyNarrative}

${prompt ? `- **سؤالك المخصص حول القصة**: ${prompt}` : ""}

**💡 الدروس والفوائد العظمى المستخلصة:**
1. **عاقبة الصبر والتقوى**: تجسد القصة سنة ربانية لا تتخلف؛ وهي أن البلاء محطة صقل للنفس وتأديب للمؤمن، ليعقبها التمكين وعلو الشأن متى ما ثبت وارتضى بقضاء الله وقدره.
2. **اللطف الإلهي الخفي**: تدور الأحداث لتثبت أن المكاره الظاهرة تستبطن رحمة خافية عن الأبصار. فخسارة مركب أو فقد ولد، بل وحتى غيابات السجين، قد تؤول إلى حماية المجتمع وحفظ الأمانات.
3. **أثر الإحسان السلوكي**: يظل الإحسان بالعمل، والتحلي بروح العدل والمروءة، وتفويض الهموم لرب الأرباب الفتيل الأساسي لحصاد العاقبة الحميدة في الدنيا والآخرة.

*(💡 **ملاحظة:** تم تزويدك بتدبر القصة من **موسوعة القصص القرآنية والتربوية المدمجة الاحتياطية** لضمان سير القراءة دون توقف. لتشغيل باحث الذكاء الاصطناعي الشامل والتفاعلي، يرجى التكرم بتزويد مفتاح الحساب الخاص بك \`GEMINI_API_KEY\` من إعدادات التطبيق).*`;
  };

  if (isGeminiApiKeyMissing()) {
    const fallbackText = generateStoryFallback();
    return res.json({ result: fallbackText, isFallback: true });
  }

  try {
    const systemPrompt = `أنت عالم وموجّه تربوي وإيماني متميز متخصص في تفسير وتدبر وتحليل القصص القرآني المذكور في كتاب الله الشريف بأسلوب يلامس القلوب ويسهل تطبيقه عملياً في واقعنا الحديث.
مهمتك هي تلقي قصة قرآنية معينة (اسم القصة وتفاصيل مقتضبة)، وسؤال أو طلب تدبر من المستخدم حولها، ومحاولة تحرير استجابة وافية، بليغة، تلامس النفوس وتثير الحث والتأمل، مع استنباط الدروس والوصايا العملية والنفسية والاجتماعية بمقاييس العصر اليوم.

يرجى الالتزام بالتعليمات التالية بدقة متناهية:
1. صِغ الرد بلغة عربية فصحى بالغة الرقي، الأناقة والعمق والجمال المعهود لأهل التفسير المضيء.
2. نسق الرد المولد بالكامل بأدق الأشكال البصرية المناسبة عبر Markdown (تقسيم بعناوين عريضة، لوحات، رموز معبرة، نقاط واضحة).
3. اجعل الأسلوب إيجابياً وموقظاً للأمل والسكينة، ومحفزاً على مكارم السلوك الاجتماعي في كافة مجالات الحياة.
4. تجنب تماماً أي مقدمات تقنية أو إشارات خادم ولا تذكر أية أمور برمجية. ابدأ مباشرة برأس الموضوع.`;

    const userPrompt = `اسم القصة: "${storyTitle}"
ملخص القصة: "${storyNarrative}"
${prompt ? `سؤال أو محاورة المستخدم حول القصة: "${prompt}"` : "أريد تدبراً معمقاً وشاملاً لهذه القصة، مع استنباط الدروس والفوائد والخطوات العملية التي يمكن تفعيلها في حياتي الخاصة والاجتماعية ونصرة الخير."}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    const resultText = response.text || "لم نتمكن من الحصول على تدبر للقصة حالياً.";
    res.json({ result: resultText });
  } catch (error: any) {
    console.error("Gemini AI Story Ponder error, returning beautiful fallback:", error.message);
    const fallbackText = generateStoryFallback();
    res.json({ result: fallbackText, isFallback: true });
  }
});

// XML Sitemap for Search Engine Indexing (Googlebot / GSC)
app.get("/sitemap.xml", (req, res) => {
  const host = req.get("host") || "qurany-app.com";
  // Detect if protocol is secure (usually is behind the proxy)
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const domain = `${protocol}://${host}`;

  res.header("Content-Type", "application/xml");
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // 1. Homepage URL
  xml += `  <url>\n`;
  xml += `    <loc>${domain}/</loc>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // 2. All 114 Surahs dynamic indexable URLs
  for (let sNum = 1; sNum <= 114; sNum++) {
    xml += `  <url>\n`;
    xml += `    <loc>${domain}/?s=${sNum}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }
  
  xml += `</urlset>`;
  res.send(xml);
});

// robots.txt to direct Google crawler with dynamic sitemap location
app.get("/robots.txt", (req, res) => {
  const host = req.get("host") || "qurany-app.com";
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const domain = `${protocol}://${host}`;

  res.header("Content-Type", "text/plain");
  res.send(`User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml
`);
});

// Setup Vite Dev Server / Static Assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve actual static assets directly (css, js, images, icons, manifest etc.)
    // EXCEPT index.html itself which we want to serve dynamically
    app.use(express.static(distPath, { index: false }));
    
    app.get("*", (req, res) => {
      // If requesting a specific file that is not HTML, let static middleware or direct path serve it
      if (req.path !== "/" && req.path !== "/index.html") {
        const fileLoc = path.join(distPath, req.path);
        if (fs.existsSync(fileLoc)) {
          return res.sendFile(fileLoc);
        }
      }

      // Serve index.html dynamically to swap SEO headers
      try {
        const indexPath = path.join(distPath, "index.html");
        let html = fs.readFileSync(indexPath, "utf-8");
        
        const host = req.get("host") || "qurany-app.com";
        const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
        const currentUrl = `${protocol}://${host}${req.originalUrl}`;
        const baseDomain = `${protocol}://${host}`;

        // Dynamic Meta Tag changes for the requested Surah (?s=X or ?surah=X)
        const sQuery = req.query.s || req.query.surah;
        const sNum = parseInt(String(sQuery));
        
        let title = "قرآني (Qurany) | المصحف الإلكتروني وتلاوة وتدبر ذكي";
        let desc = "موقع قرآني: مصحف إلكتروني شامل مخصص لقراءة وتلاوة وتدبر القرآن الكريم ببراعة وسلاسة. يحتوي على تلاوات عذبة بأصوات جليلة، تفسير وتراجم سور وآيات، محرك بحث متقدم، ومساعد ذكي تفاعلي.";
        let keywords = "قرآني, قراني, قرآن, القرآن الكريم, مصحف, المصحف الإلكتروني, تلاوات خاشعة, قراء مشاهير, تفسير القرآن, تدبر القرآن, أهداف القراءة, حفظ القرآن, ذكاء اصطناعي إسلامي, الورد اليومي, أذكار, طمأنينة, qurany, quran, holy quran";
        
        if (!isNaN(sNum) && sNum >= 1 && sNum <= 114) {
          const surah = surahList.find(s => s.number === sNum);
          if (surah) {
            const rType = surah.revelationType === "Meccan" || surah.arabicType === "مكية" ? "مكية" : "مدنية";
            title = `سورة ${surah.name} مكتوبة كاملة بالرسم العثماني مع التفسير والترجمة | قرآني`;
            desc = `اقرأ وتدبر سورة ${surah.name} الكريمة كاملة بالرسم العثماني الشقيق (${surah.numberOfAyahs} آية، نزلت في ${rType})، مع تفسير الجلالين والترجمة الإنجليزية الفورية والاستماع العذب لأشهر القراء على منصة قرآني الذكية.`;
            keywords = `سورة ${surah.name}, تفسير سورة ${surah.name}, سورة ${surah.name} مكتوبة, قراءة سورة ${surah.name}, سورة ${surah.name} بالتشكيل, القرآن الكريم, تفسير الجلالين, قرآني`;
          }
        }

        // Apply HTML optimizations on the fly
        // Replace Title element
        html = html.replace(/<title>[^<]*<\/title>/g, `<title>${title}</title>`);
        
        // Replace Description meta tag
        html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/gi, `<meta name="description" content="${desc}" />`);
        
        // Replace Keywords tag
        html = html.replace(/<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/gi, `<meta name="keywords" content="${keywords}" />`);
        
        // Replace Canonical links dynamically using current domain
        html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi, `<link rel="canonical" href="${currentUrl}" />`);
        
        // Replace Open Graph metadata to look gorgeous on socials with current domain
        html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/gi, `<meta property="og:url" content="${currentUrl}" />`);
        html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/gi, `<meta property="og:title" content="${title}" />`);
        html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/gi, `<meta property="og:description" content="${desc}" />`);
        
        // Replace Twitter SEO tags
        html = html.replace(/<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/gi, `<meta name="twitter:url" content="${currentUrl}" />`);
        html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/gi, `<meta name="twitter:title" content="${title}" />`);
        html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/gi, `<meta name="twitter:description" content="${desc}" />`);

        // Replace any hardcoded placeholder domains inside structured markup / schemas
        html = html.replaceAll("https://service-22577922415.europe-west2.run.app/", `${baseDomain}/`);

        res.send(html);
      } catch (err) {
        console.error("Error serving and compiling dynamic SEO tags:", err);
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} with environment ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();

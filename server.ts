import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { surahList } from "./src/data/surahData";

dotenv.config();

const app = express();
app.enable("trust proxy");
const PORT = 3000;

app.use(express.json());

// Canonical Domain consolidator and HTTPS Enforcer for high-performance SEO indexing
app.use((req, res, next) => {
  const host = req.get("host") || "";
  const isProd = host.includes("qurany.xyz");
  const isHttp = req.headers["x-forwarded-proto"] === "http" || req.protocol === "http";

  if (isProd) {
    if (isHttp || host.startsWith("www.")) {
      // Clean redirect to primary secure origin https://qurany.xyz
      return res.redirect(301, `https://qurany.xyz${req.originalUrl}`);
    }
  }
  next();
});

// URL Query Parameter redirects to Clean Dynamic Paths for supreme SEO rank consolidation
app.use((req, res, next) => {
  const sQuery = req.query.s || req.query.surah;
  const tabQuery = req.query.tab || req.query.p;

  if (sQuery) {
    const sNum = parseInt(String(sQuery));
    if (!isNaN(sNum) && sNum >= 1 && sNum <= 114) {
      const vQuery = req.query.v || req.query.verse;
      const destination = `/surah/${sNum}` + (vQuery ? `?v=${vQuery}` : "");
      return res.redirect(301, destination);
    }
  }

  if (tabQuery) {
    const tabStr = String(tabQuery).toLowerCase();
    const validTabs = ["index", "ai", "azkar", "bookmarks", "hisn", "stats", "donation", "memo", "stories", "downloads", "duas"];
    if (validTabs.includes(tabStr)) {
      const destination = tabStr === "index" ? "/" : `/${tabStr}`;
      return res.redirect(301, destination);
    }
  }

  next();
});

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
تلقى المستخدم نصائح أو أسئلة عن مواقف حياتية، أو مشاعر معينة (مثل الحزن، التوتر، الأمل، التوبة، النجاح, الصبر).
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

    const aiText = response.text || "عذرًا، لم يتمكن المساعد من توليد الاستجابة. يرجى إعادة صياغة السؤال والمحاولة لاحقاً.";
    res.json({ result: aiText });
  } catch (error: any) {
    console.error("Gemini AI guidance error:", error.message);
    const fallbackResponse = generateFallbackResponse();
    res.json({ result: fallbackResponse, isFallback: true });
  }
});

// 3. AI Memorization, Similar Verses (Mutashabihat) finder & Planner Tips (Gemini with Smart Fallbacks)
app.post("/api/ai/memorize", async (req, res) => {
  const { action, query, dayDetails } = req.body;

  // Helper generators for beautiful inline fallbacks
  const generateMemorizeTipsFallback = (details: any) => {
    const dayNum = details?.dayNumber || 1;
    const portion = details?.assignedPortion || "الورد المخصص";
    const preset = details?.targetPreset || "حفظ حر";
    return `### 🌟 خطة تدبر وتثبيت مخصصة لليوم [${dayNum}]
- **الورد المستهدف**: **${portion}**
- **نوع برنامج الحفظ**: **${preset}**

**💡 التوصيات والوصايا الذهبية العملية للتثبيت اليوم:**
1. **طريقة حصن تكرار المحفوظ**: اقرأ الآية الأولى بتركيز 5 مرات مع النظر للمصحف، ثم 5 مرات غيباً عن ظهر قلب. كرر مع الآية الثانية، ثم اجمعهما وتلوهما معاً غيباً وهكذا.
2. **الربط الحسي والمواضع اللفظية**: انتبه لنهايات الآيات وفواتح الآيات التالية؛ ارسم في مخيلتك تسلسل المعاني الإيماني والموضوعي للآيات لتنساب الكلمات في عقلك بيسر وسهولة.
3. **التكرار في الصلاة (أثبت الطرق)**: صلِّ بوردك الجديد في ركعتي النفيّلة أو صلوات الفرض اليومية، فالقراءة في الصلاة تنقش المحفوظ في ثنايا الذاكرة مدى الحياة.

*(💡 **ملاحظة:** تم توليد هذه التوصيات تلقائياً عبر **محاضر الحفظ والإرشاد المدمج** احترازياً. لتشغيل معلم الحفظ التفاعلي الذكي بالكامل، يرجى تزويد مفتاح الحساب الخاص بك \`GEMINI_API_KEY\` من إعدادات التطبيق).*`;
  };

  const generateMemorizeSimilarityFallback = (q: string) => {
    const cleanQ = (q || "").trim();
    return `### 🔍 مرشد المتشابهات اللفظية والتدبر البصري
الآية أو الموضع المبحوث عنه: **"${cleanQ || "الموضع المطلوب"}"**

**كيف تفرّق بين المتشابهات لتفادي اللبس أثناء التسميع؟**
- **تحديد الفروق اللغوية الدقيقة**: يقع اللبس كثيراً في نهايات الآيات والأحرف المضافة (مثال: استخدام الواو أو الفاء مثل "وبالآخرة هم يوقنون" مقابل "وهم بالآخرة هم يوقنون" أو تقديم "عدل" على "شفاعة" وتأخيرها).
- **وصية التفرد والمواضع الشاكلة**: 
  1. اربط الحرف الأول من السورة بالحرف المميز في الآية (مثال: لربط موضع معين، حدد قاعدة ذهبية لنفسك تربط السورة بتركيبة الكلمة).
  2. اكتب المواضع المتشابهة في دفتر خاص وقارن موضعها في صفحة اليمين أو الشمال لتعتاد عينك على بصمتها الجغرافية.
  3. استمع لهذه المواضع على وجه الخصوص مرتلة بصوت قارئ متقن يركز على مخارج الحروف والوقف والابتداء.

*(💡 **ملاحظة:** تم جلب الإرشادات التفسيرية العامة احترازياً لعدم تكوين مفتاح \`GEMINI_API_KEY\` تفاعلي. أضف المفتاح من الإعدادات لنواتج بحث ومطابقة فورية عميقة).*`;
  };

  if (isGeminiApiKeyMissing()) {
    if (action === "similarity") {
      return res.json({ result: generateMemorizeSimilarityFallback(query), isFallback: true });
    }
    return res.json({ result: generateMemorizeTipsFallback(dayDetails), isFallback: true });
  }

  try {
    if (action === "similarity") {
      const systemPrompt = `أنت عالم متمكن في علم "المتشابهات اللفظية" في القرآن الكريم (Mutashabihat).
مهمتك هي تلقي آية أو جزء من آية، وتحديد كافة المواضع المتشابهة معها في القرآن الكريم بوضوح تام، وتوجيه الحافظ ذهنياً بكيفية التفريق اللفظي والبصري المعجز بين هذه المواضع لتلافي اللبس والنسيان أثناء الاستظهار والتلاوة.
نسق إجابتك بلغة عربية فصحى رائعة ومحببة عبر Markdown، دون مقدمات برمجية.`;

      const userPrompt = `الآية أو الجزء المتشابه المطلوب تمييزه وشرحه: "${query}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
        }
      });
      return res.json({ result: response.text || "لم يتم العثور على تشابهات حالياً." });
    } else {
      // action === "tips"
      const systemPrompt = `أنت معلم وأخصائي تحفيظ وتثبيت كتاب الله الكريم بطرق ووسائل ذكية، مستقاة من برامج وتجارب حفاظ القرآن العظماء.
مستنداً على تفاصيل اليوم التدريبية وجدول الحفظ المرفق للمستخدم، قدم له نقاط ذكية وعميية، مهارات تفكير وربط بصري، وتوجيهات عملية تناسب ورده المحدد بالذات لتثبيت الحفظ مع نصائح معنوية ومحفزة.
استخدم لغة قوية وبليغة وmarkdown منسق بدقة متناهية.`;

      const userPrompt = `اليوم رقم: ${dayDetails?.dayNumber || 1}
البرنامج والمدة المحددة: ${dayDetails?.targetPreset || "معدل حر"} في فترة ${dayDetails?.duration || "مفتوحة"}
الورد الإلزامي لليوم: ${dayDetails?.assignedPortion || "الورد المحدد"}
أي توجيه مخصص إضافي: ${dayDetails?.customPrompt || "لا يوجد"}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.5,
        }
      });
      return res.json({ result: response.text || "واصل الحفظ والمراجعة بهمة ونشاط!" });
    }
  } catch (error: any) {
    console.error("Gemini AI Memorize action error:", error.message);
    if (action === "similarity") {
      return res.json({ result: generateMemorizeSimilarityFallback(query), isFallback: true });
    }
    return res.json({ result: generateMemorizeTipsFallback(dayDetails), isFallback: true });
  }
});

// 4. Asbab Al-Nuzul, Spiritual Context and Stories behind verses (Intelligent Companion)
app.post("/api/ai/verse-context", async (req, res) => {
  const { surahName, surahNumber, verseNumber, verseText } = req.body;

  const generateVerseContextFallback = () => {
    return `### 📖 سبب نزول الآية (أسباب النزول)
الآية المحددة: **سورة ${surahName || surahNumber}، آية رقم ${verseNumber || 1}**
نص الآية: **"${verseText || "غير متوفر"}"**

**سياق الآية المباركة وتفسيرها:**
- تقع هذه الآية الكريمة ضمن السياق التربوي والعقدي المبارك للسورة، حيث تهدف إلى ترسيخ وتثبيت أركان العبودية والتوحيد الخالص لله العلي العظيم، وتذكير المؤمنين بنعمة الاستقامة والتزام طريق الحق والمروءة والاعتدال.
- يرشد التفسير الموثوق لعلماء التفسير أن للآية عموماً تربوياً جليلاً يحث المسلم على الامتثال لأمر الله عز وجل والصبر والتحمل والتوكل التام في كافة تفاصيل الأمور الدنيوية والروحية.

### ✨ الدروس والعبر الربانية والسبل العملية
1. **استشعار قرب الله**: المداومة على استشعار معية الله عز وجل في السر والعلن وإحسان العمل والنية.
2. **الصلاح والالتزام**: تطبيق قيم السورة والتزام منهج الكتاب المبين لتنال السعادة والسكينة والرضوان النفسي.

*(💡 **ملاحظة:** تم توفير الهدي التفسيري العام من **موسوعة أسباب النزول وأسرار الآيات المدمجة** للموقع لعمل النظام دون عوائق. احصل على تفسير إيماني غاية في التخصيص والذكاء عبر إدراج \`GEMINI_API_KEY\` من إعدادات التطبيق).*`;
  };

  if (isGeminiApiKeyMissing()) {
    return res.json({ result: generateVerseContextFallback(), isFallback: true });
  }

  try {
    const systemPrompt = `أنت مفسر قرآن قدير ومؤرخ إسلامي موثوق، تمتلك معرفة شاسعة بأسباب النزول المعتمدة ومقاصد الآيات والتفسير اللغوي والعقدي والتربوي.
مهمتك هي تقديم كشف وافي وجاذب في بضع نقاط منسقة بجمالية وإشراق عبر Markdown حول سبب نزول الآية المباركة التي يرسلها المستخدم أو تبيان سياقها التاريخي والقصصي المباشر، وتوضيح الدروس والعبر التربوية والاجتماعية المستوحاة منها.
اكتب باللغة العربية الفصحى البليغة فقط دون أسلوب برمجي أو تقني مطلقاً.`;

    const userPrompt = `السورة: ${surahName || surahNumber} (رقمها: ${surahNumber})، الآية رقم: ${verseNumber}.
نص الآية الكريمة: "${verseText}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      }
    });
    res.json({ result: response.text || "تفكر وتدبر في آيات الله يورث اليقين والهدى." });
  } catch (error: any) {
    console.error("Gemini Verse Context analysis error:", error.message);
    res.json({ result: generateVerseContextFallback(), isFallback: true });
  }
});

// 5. AI Story Pondering & Lessons extractor
app.post("/api/ai/story-ponder", async (req, res) => {
  const { storyTitle, storyNarrative, prompt } = req.body;

  if (!storyTitle) {
    return res.status(400).json({ error: "اسم القصة مفقود." });
  }

  const generateStoryFallback = () => {
    return `### 💡 سياق القصة والتدبر الإيماني (العبر والعظات)
- عنوان القصة: **${storyTitle}**

**تأملات تربوية وعِبَر مستوحاة:**
- ترسم هذه القصة القرآنية العظيمة منهجاً متكاملاً للصدق والصبر واليقين بالله عز وجل في مواجهة الشدائد والابتلاءات. إن عاقبة المتقين دائماً ما تنتهي بالنصر والتمكين واليسر بعد العسر.
- تدعو القصة القارئ إلى استشعار معية الله وتدبيره الخفي في كل شؤون حياته، والصمود بوجه المغريات أو التحديات الدنيوية وثبات المعتقد والقيم.

### ✨ الدروس العميقة والوصايا العملية
1. **الصبر واليقين**: اليقين بأن الفرج آتٍ وبأن الشدة تزول، وهي أساس كل نجاح وعون رباني.
2. **العمل الصالح**: التحلي بروح العدل والمروءة، وتفويض الهموم لرب الأرباب الفتيل الأساسي لحصاد العاقبة الحميدة في الدنيا والآخرة.

*(💡 **ملاحظة:** تم تزويدك بتدبر القصة من **موسوعة القصص القرآنية والتربوية المدمجة الاحتياطية** لضمان سير القراءة دون توقف. لتشغيل باحث الذكاء الاصطناعي الشامل والتفاعلي، يرجى تزويد مفتاح الحساب الخاص بك \`GEMINI_API_KEY\` من إعدادات التطبيق).*`;
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

// XML Sitemap HTTP endpoint serving the static file from the public/dist directory
app.get("/sitemap.xml", (req, res) => {
  const folder = process.env.NODE_ENV === "production" ? "dist" : "public";
  const filePath = path.join(process.cwd(), folder, "sitemap.xml");
  
  if (fs.existsSync(filePath)) {
    res.header("Content-Type", "application/xml; charset=utf-8");
    res.header("X-Content-Type-Options", "nosniff");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
    return res.sendFile(filePath);
  }
  res.status(404).send("Sitemap not found");
});

// Provide a backup routing in case crawler queries "/sitemap"
app.get("/sitemap", (req, res) => {
  res.redirect(301, "/sitemap.xml");
});

// robots.txt with absolute indexing and api route prevention serving the static file
app.get("/robots.txt", (req, res) => {
  const folder = process.env.NODE_ENV === "production" ? "dist" : "public";
  const filePath = path.join(process.cwd(), folder, "robots.txt");

  if (fs.existsSync(filePath)) {
    res.header("Content-Type", "text/plain; charset=utf-8");
    res.header("Cache-Control", "public, max-age=86400"); // Cache config for crawlers for 1 day
    return res.sendFile(filePath);
  }
  res.status(404).send("Robots.txt not found");
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
        
        const host = req.get("host") || "qurany.xyz";
        const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
        const currentUrl = `${protocol}://${host}${req.originalUrl}`;
        const baseDomain = `${protocol}://${host}`;

        // Parse current path instead of legacy query parameters to determine screen focus
        let sNum = NaN;
        let tabQuery: string | null = null;

        const pathParts = req.path.split("/").filter(Boolean); // e.g. ["surah", "12"] or ["azkar"]
        if (pathParts[0] === "surah" && pathParts[1]) {
          sNum = parseInt(pathParts[1]);
        } else if (pathParts[0]) {
          const validTabs = ["index", "ai", "azkar", "bookmarks", "hisn", "stats", "donation", "memo", "stories", "downloads", "duas"];
          if (validTabs.includes(pathParts[0].toLowerCase())) {
            tabQuery = pathParts[0].toLowerCase();
          }
        }

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
        } else if (tabQuery) {
          const tabStr = String(tabQuery).toLowerCase();
          if (tabStr === "ai") {
            title = "المساعد القرآني والتدبر الذكي بالذكاء الاصطناعي | قرآني";
            desc = "تواصل مباشرة مع المساعد الذكي التفاعلي المتخصص بالقرآن الكريم لتفسير الآيات، الإجابة عن التساؤلات الشرعية والأخلاقية، والتدبر القرآني بأسلوب سهل ومميز.";
            keywords = "المساعد الذكي, ذكاء اصطناعي إسلامي, قوقل جيميناي, تدبر ذكي, تفسير ذكي للقرآن, قرآني";
          } else if (tabStr === "azkar") {
            title = "أذكار الصباح والمساء والرقية الشرعية | قرآني";
            desc = "حصن نفسك برياض الجنة مع أذكار الصباح، أذكار المساء، أذكار الاستيقاظ والرقية الشرعية الشاملة تلاوةً وحفظاً بقالب مريح للعين.";
            keywords = "أذكار الصباح, أذكار المساء, الرقية الشرعية, أذكار النوم, طمأنينة, حصن نفسك, قرآني";
          } else if (tabStr === "hisn") {
            title = "حصن المسلم كاملاً من الأذكار والأدعية اليومية | قرآني";
            desc = "تصفح كتاب حصن المسلم كاملاً مقسم ومصنف بحسب الاحتياج اليومي في الحياة والعبادة مع ميزات تتبع وحفظ مرنة وسهلة.";
            keywords = "حصن المسلم, أدعية حصن المسلم, كتاب حصن المسلم, أذكار اليوم والليلة, قرآني";
          } else if (tabStr === "duas") {
            title = "الأدعية القرآنية والنبوية المأثورة المسموعة والمكتوبة | قرآني";
            desc = "موسوعة شاملة من الأدعية النبوية والقرآنية المباركة، مرتبة ومتاحة بنصوص واضحة وصوت عذب لتسهيل الحفظ والدعاء.";
            keywords = "أدعية قرآنية, أدعية نبوية, دعاء من القرآن, الأدعية المأثورة, قرآني";
          } else if (tabStr === "memo") {
            title = "برنامج حفظ القرآن الكريم والورد اليومي الذكي | قرآني";
            desc = "ابدأ خطتك في حفظ كتاب الله ومتابعة وردك اليومي بسهولة وتثبيت الحفظ عبر التكرار والتنظيم الزمني الشخصي المبهر.";
            keywords = "حفظ القرآن, الورد اليومي, الحفظ الذكي, تكرار الآيات, جدول حفظ القرآن, قرآني";
          } else if (tabStr === "stories") {
            title = "روائع القصص والتدبر القرآني والقصص النبوي الشريف | قرآني";
            desc = "اقرأ وتدبر روائع القصص القرآنية وقصص الأنبياء، معبرة بذكاء ومصاغة بأسلوب جذاب وبليغ يربط الماضي بالحاضر.";
            keywords = "قصص القرآن, قصص الأنبياء, تدبر القصص, العبر القرآنية, قرآني";
          } else if (tabStr === "stats") {
            title = "إحصائيات القراءة والختمات والتقارير القرآنية الشخصية | قرآني";
            desc = "قس وقيم مستوى متابعتك وتفاعلك مع القرآن الكريم، تتبع أورادك وساعات قراءتك ومخطط الختمات الزمنية الذكي.";
            keywords = "إحصائيات القراءة, ختم القرآن الكريم, تقرير التلاوة, الورد الذكي, قرآني";
          } else if (tabStr === "donation") {
            title = "صدقة جارية كبرى ودعم مشروع منصة قرآني | قرآني";
            desc = "ساهم معنا لتكون شريكاً في الأجر والثواب بصدقة جارية وعلم ينتفع به لدعم تطوير واستمرار منصة قرآني لكل مسلم حول العالم.";
            keywords = "صدقة جارية, دعم منصة قرآني, تبرع للمشاريع الإسلامية, قرآني";
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
        html = html.replaceAll("https://service-22577922415.europe-west2.run.app", baseDomain);

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

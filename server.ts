import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import { surahList } from "./src/data/surahData";
import {
  generateLocalGuidance,
  generateLocalMemorizationTips,
  generateLocalSimilarity,
  generateLocalVerseContext,
  generateLocalStoryPonder,
} from "./src/utils/quranAiEngine";

dotenv.config();

const app = express();
app.enable("trust proxy");

const getPort = (): number => {
  const args = process.argv;
  const portArgIndex = args.indexOf("--port");
  if (portArgIndex !== -1 && args[portArgIndex + 1]) {
    const parsed = parseInt(args[portArgIndex + 1]);
    if (!isNaN(parsed)) return parsed;
  }
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT);
    if (!isNaN(parsed)) return parsed;
  }
  return 3000;
};
const PORT = getPort();

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

// Dynamic server-side Gemini client & resilient multi-model failover with cooldown tracking
const modelCooldownUntil = new Map<string, number>();
const aiResponseCache = new Map<string, any>();

const getActiveApiKey = (): string => {
  const key = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  if (!key || key.trim() === "" || key === "MY_GEMINI_API_KEY" || key === "YOUR_GEMINI_API_KEY" || key.includes("MY_")) {
    return "";
  }
  return key.trim();
};

const isGeminiApiKeyMissing = () => {
  return getActiveApiKey() === "";
};

const generateGeminiContent = async (params: {
  contents: any;
  config?: any;
}) => {
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    throw new Error("No active API key configured");
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Official Gemini models with automatic failover (prioritizing responsive production models)
  const candidateModels = [
    { name: "gemini-3.5-flash", useThinking: false },
    { name: "gemini-3.5-flash-lite", useThinking: false },
    { name: "gemini-3.8-flash", useThinking: true },
    { name: "gemini-3.1-flash-lite-preview", useThinking: false },
  ];

  const now = Date.now();
  const availableModels = candidateModels.filter((m) => (modelCooldownUntil.get(m.name) || 0) <= now);
  const modelsToTry = availableModels.length > 0 ? availableModels : candidateModels;

  // Strip deprecated sampling parameters (temperature, topP, topK, candidateCount, thinkingBudget)
  const sanitizedConfig: Record<string, any> = {};
  if (params.config && typeof params.config === "object") {
    for (const [k, v] of Object.entries(params.config)) {
      if (!["temperature", "topP", "topK", "candidateCount", "thinkingBudget"].includes(k)) {
        sanitizedConfig[k] = v;
      }
    }
  }

  let lastError: any = null;
  for (const modelInfo of modelsToTry) {
    try {
      const callConfig = modelInfo.useThinking
        ? { ...sanitizedConfig, thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
        : { ...sanitizedConfig };

      const generatePromise = ai.models.generateContent({
        model: modelInfo.name,
        contents: params.contents,
        config: callConfig,
      });

      // 6.5s timeout per model to prevent serverless function hangs and guarantee instant fallback
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after 6500ms on ${modelInfo.name}`)), 6500)
      );

      return await Promise.race([generatePromise, timeoutPromise]);
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || "");
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota") || msg.includes("UNAVAILABLE") || msg.includes("503")) {
        modelCooldownUntil.set(modelInfo.name, Date.now() + 10 * 60 * 1000);
      }
      console.warn(`Model ${modelInfo.name} failed/timed out, trying next candidate:`, msg.slice(0, 160));
    }
  }

  throw lastError || new Error("All candidate models failed");
};

// In-memory caching for faster search and surah results
const searchCache = new Map<string, any>();
const ayahCache = new Map<number, string>();
const memorySurahCache = new Map<number, any>();

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

// Safe directory resolver for read/write cache (handles serverless environments like Vercel gracefully)
const getSafeCacheDir = () => {
  const localDir = path.join(process.cwd(), "cache_surahs");
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch {
    // If current directory is read-only (e.g. AWS Lambda / Vercel Serverless), fallback to /tmp
    const tmpDir = path.join(os.tmpdir(), "cache_surahs");
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return tmpDir;
    } catch {
      return null;
    }
  }
};

const CACHE_DIR = getSafeCacheDir();

// Helper to delay execution (used for retry backoff)
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper to fetch with retry logic
const fetchWithRetry = async (url: string, retries = 3, backoff = 300): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      console.warn(`Fetch attempt ${i + 1} failed with status: ${response.status}. Retrying in ${backoff}ms...`);
    } catch (err: any) {
      console.warn(`Fetch attempt ${i + 1} encountered network error: ${err.message}. Retrying in ${backoff}ms...`);
    }
    if (i < retries - 1) {
      await delay(backoff);
      backoff *= 2; // exponential backoff
    }
  }
  throw new Error(`Failed to fetch after ${retries} attempts.`);
};

// 1. Fetch Surah detail with translation & Arabic Tafsir al-Jalalayn
app.get("/api/surah/:number", async (req, res) => {
  const surahNumber = parseInt(req.params.number);
  if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return res.status(400).json({ error: "Invalid surah number. Must be between 1 and 114." });
  }

  // A1. Check in-memory cache first (instant response, zero disk I/O)
  if (memorySurahCache.has(surahNumber)) {
    res.header("X-Cache", "HIT-MEMORY");
    return res.json(memorySurahCache.get(surahNumber));
  }

  // A2. Check filesystem cache
  if (CACHE_DIR) {
    const cachePath = path.join(CACHE_DIR, `surah_${surahNumber}.json`);
    if (fs.existsSync(cachePath)) {
      try {
        const cachedDataStr = fs.readFileSync(cachePath, "utf-8");
        const cachedData = JSON.parse(cachedDataStr);
        if (cachedData && cachedData.verses && cachedData.verses.length > 0) {
          memorySurahCache.set(surahNumber, cachedData);
          res.header("X-Cache", "HIT-DISK");
          return res.json(cachedData);
        }
      } catch (cacheReadErr: any) {
        console.error(`Local cache file read glitch (Surah ${surahNumber}):`, cacheReadErr.message);
      }
    }
  }

  // B. Not in cache: fetch it from public cloud API with resilient retry and timeout parameters
  try {
    const apiUrl = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,ar.jalalayn`;
    
    const response = await fetchWithRetry(apiUrl, 3, 400);
    const json = await response.json();
    
    if (json.code !== 200 || !json.data || json.data.length < 3) {
      throw new Error("Invalid or incomplete data structure returned from Quran API.");
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

    const combinedResult = {
      number: uthmaniData.number,
      name: uthmaniData.name,
      englishName: uthmaniData.englishName,
      englishNameTranslation: uthmaniData.englishNameTranslation,
      numberOfAyahs: uthmaniData.numberOfAyahs,
      revelationType: uthmaniData.revelationType,
      verses: verses
    };

    // C1. Save to in-memory cache
    memorySurahCache.set(surahNumber, combinedResult);

    // C2. Save to local disk cache persistently if writable
    if (CACHE_DIR) {
      try {
        const cachePath = path.join(CACHE_DIR, `surah_${surahNumber}.json`);
        fs.writeFileSync(cachePath, JSON.stringify(combinedResult, null, 2), "utf-8");
      } catch (cacheWriteErr: any) {
        console.warn(`Note: Could not write Surah ${surahNumber} to disk cache:`, cacheWriteErr.message);
      }
    }

    res.header("X-Cache", "MISS");
    res.json(combinedResult);
  } catch (error: any) {
    console.error(`Total exhaustion error fetching surah ${surahNumber}:`, error.message);
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

      const response = await generateGeminiContent({
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

// 2. AI Tafsir, Quranic Guidance and Spiritual Finder Endpoint
app.post("/api/ai/guidance", async (req, res) => {
  const { prompt, verseText, contextType, history, extraTafsir } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "الرجاء إدخال نص السؤال أو التدبر." });
  }

  const cacheKey = `guidance:${contextType || "general"}:${verseText || ""}:${prompt.trim()}`;
  if (aiResponseCache.has(cacheKey) && (!history || history.length <= 1)) {
    return res.json({ result: aiResponseCache.get(cacheKey) });
  }

  const generateFallbackResponse = () =>
    generateLocalGuidance({ prompt, verseText, contextType, extraTafsir });

  if (isGeminiApiKeyMissing()) {
    return res.json({ result: generateFallbackResponse() });
  }

  try {
    let systemPrompt = "";
    let userPrompt = "";

    const historyContext = Array.isArray(history) && history.length > 0
      ? "\n\nسياق المحادثة السابقة:\n" + history.slice(-4).map((m: any) => `${m.sender === "user" ? "المستخدم" : "المرشد"}: ${m.text}`).join("\n")
      : "";

    if (contextType === "verse-tafsir" || verseText) {
      systemPrompt = `أنت مفسر قرآن كريم وعالم إيماني حكيم ورفيق مبسط للعلوم الإسلامية، تعتمد على أمهات كتب التفسير الموثوقة (تفسير ابن كثير، الطبري، السعدي، والجلالين).
مهمتك هي شرح وتدبر الآية الكريمة التي يرسلها لك المستخدم بالتفصيل والعمق، مع بيان معاني المفردات، سبب النزول إن وُجد، والهدايات التربوية والعملية، بأسلوب هادئ، تفاؤلي، علمي، ورحيم.
صيغة الرد يجب أن تكون باللغة العربية الفصحى الأنيقة والجذابة، مقسمة إلى فقرات واضحة ومنسقة بـ Markdown (العناوين، النقاط، الاقتباسات).
لا تذكر أي تفاصيل تقنية أو برمجية على الإطلاق.`;
      
      userPrompt = `الآية المراد تدبرها وشرحها: "${verseText}"
سؤال المستخدم حولها: ${prompt}${historyContext}`;
    } else {
      systemPrompt = `أنت مرشد روحي وعالم تفسير قرآني ذو حكمة عالية وأسلوب رحيم ومقنع، تعتمد على القرآن الكريم والسنة النبوية الصحيحة وتفاسير العلماء المعتمدين.
مهمتك الأساسية هي الإجابة عن أسئلة المستخدم الدينية والتدبرية أو تقديم الاستشارات الإيمانية المبنية على القرآن الكريم.
يجب عليك:
1. ذكر آية (أو أكثر) مناسبة بدقة لموضوع سؤال المستخدم مع كتابة نص الآية بالرسم القرآني المشكول وتحديد اسم السورة ورقم الآية.
2. تفسير وتدبر هذه الآيات الكريمة بأسلوب ميسر وعميق يلامس القلب ويريح النفس.
3. التوجيه العملي الواقعي: خطوات عملية واضحة لتطبيق هذا التوجيه القرآني في الحياة اليومية، مع دعاء قرآني أو نبوي خاشع يناسب المقام.
4. الرد بأسلوب غاية في الرقي والفصاحة باللغة العربية الفصحى المنسقة بـ Markdown بشكل احترافي.`;

      userPrompt = `سؤال المستخدم أو موضوع التدبر: "${prompt}"${historyContext}`;
    }

    const response = await generateGeminiContent({
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const aiText = response.text || generateFallbackResponse();
    aiResponseCache.set(cacheKey, aiText);
    res.json({ result: aiText });
  } catch (error: any) {
    console.error("Gemini AI guidance error:", error.message);
    res.json({ result: generateFallbackResponse() });
  }
});

// 3. AI Memorization, Similar Verses (Mutashabihat) finder & Planner Tips
app.post("/api/ai/memorize", async (req, res) => {
  const { action, query, verseText, text, dayDetails } = req.body;
  const effectiveQuery = String(query || verseText || text || "").trim();

  if (isGeminiApiKeyMissing()) {
    if (action === "similarity") {
      return res.json(generateLocalSimilarity(effectiveQuery));
    }
    return res.json({ result: generateLocalMemorizationTips(dayDetails) });
  }

  try {
    if (action === "similarity") {
      const cacheKey = `similarity:${effectiveQuery}`;
      if (aiResponseCache.has(cacheKey)) {
        return res.json(aiResponseCache.get(cacheKey));
      }

      const systemPrompt = `أنت عالم متمكن في علم "المتشابهات اللفظية" في القرآن الكريم (Mutashabihat) وضبط الحفظ.
مهمتك هي تلقي آية أو عبارة قرآنية من المستخدم، وتحديد النص القرآني الصحيح لها، ثم استخراج أبرز الآيات المتشابهة معها لفظياً في سور القرآن الكريم، مع توضيح الفرق الدقيق بين كل موضع، وتقديم قاعدة ذهبية أو رابط ذهني يساعد الحافظ على عدم الخلط بينها.
يجب إرجاع النتيجة بصيغة JSON حصراً مطابقة للهيكل التالي تماماً دون أي نص خارجي:
{
  "originalVerse": "النص القرآني المشكول للآية أو العبارة المبحوث عنها",
  "similarVerses": [
    {
      "text": "نص الآية المتشابهة بالتشكيل الكامل",
      "surahName": "اسم السورة (مثال: سورة البقرة)",
      "ayahNumber": 173,
      "differenceDetails": "شرح الفرق اللفظي الدقيق في الكلمات أو الحروف أو الفواصل",
      "connectionTip": "ضابط ذهني أو قاعدة ربط ذكية لمنع اللبس عند التسميع"
    }
  ]
}`;

      const userPrompt = `حلل المتشابهات القرآنية للعبارة أو الآية التالية وأرجع النتيجة بصيغة JSON: "${effectiveQuery}"`;

      const response = await generateGeminiContent({
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      const rawText = (response.text || "").trim();
      try {
        const parsed = JSON.parse(rawText);
        if (parsed && parsed.originalVerse && Array.isArray(parsed.similarVerses)) {
          aiResponseCache.set(cacheKey, parsed);
          return res.json(parsed);
        }
      } catch (parseErr) {
        console.warn("Failed to parse similarity JSON, using structured fallback:", parseErr);
      }
      return res.json(generateLocalSimilarity(effectiveQuery));
    } else {
      const cacheKey = `memo-tips:${dayDetails?.dayNumber || 1}:${dayDetails?.targetPreset || ""}:${dayDetails?.assignedPortion || ""}`;
      if (aiResponseCache.has(cacheKey)) {
        return res.json({ result: aiResponseCache.get(cacheKey) });
      }

      const systemPrompt = `أنت معلم وأخصائي تحفيظ وتثبيت كتاب الله الكريم بطرق ووسائل ذكية، مستقاة من برامج وتجارب حفاظ القرآن المهرة.
مستنداً على تفاصيل اليوم التدريبية وجدول الحفظ المرفق للمستخدم، قدم له نقاطاً ذكية وعملية، ومهارات تفكير وربط بصري ومعنوي، وتوجيهات عملية تناسب ورده المحدد بالذات لتثبيت الحفظ مع نصائح إيمانية محفزة.
استخدم لغة عربية فصحى بليغة ومنسقة عبر Markdown بدقة متناهية.`;

      const userPrompt = `اليوم رقم: ${dayDetails?.dayNumber || 1}
البرنامج والمدة المحددة: ${dayDetails?.targetPreset || "معدل حر"} في فترة ${dayDetails?.duration || "مفتوحة"}
الورد الإلزامي لليوم: ${dayDetails?.assignedPortion || "الورد المحدد"}
أي توجيه مخصص إضافي: ${dayDetails?.customPrompt || "لا يوجد"}`;

      const response = await generateGeminiContent({
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
        }
      });
      const resultText = response.text || generateLocalMemorizationTips(dayDetails);
      aiResponseCache.set(cacheKey, resultText);
      return res.json({ result: resultText });
    }
  } catch (error: any) {
    console.error("Gemini AI Memorize action error:", error.message);
    if (action === "similarity") {
      return res.json(generateLocalSimilarity(effectiveQuery));
    }
    return res.json({ result: generateLocalMemorizationTips(dayDetails) });
  }
});

// 4. Asbab Al-Nuzul, Spiritual Context and Stories behind verses
app.post("/api/ai/verse-context", async (req, res) => {
  const { surahName, surahNumber, verseNumber, verseText, tafsir } = req.body;

  const cacheKey = `verse-context:${surahNumber}:${verseNumber}`;
  if (aiResponseCache.has(cacheKey)) {
    return res.json({ result: aiResponseCache.get(cacheKey) });
  }

  let resolvedTafsir = tafsir || "";
  if (!resolvedTafsir && surahNumber && verseNumber) {
    // 1. Try memory cache first
    const memoryCached = memorySurahCache.get(Number(surahNumber));
    if (memoryCached?.verses) {
      const foundVerse = memoryCached.verses.find((v: any) => v.numberInSurah === Number(verseNumber));
      if (foundVerse?.tafsir) resolvedTafsir = foundVerse.tafsir;
    }

    // 2. Try disk cache if not found in memory
    if (!resolvedTafsir && CACHE_DIR) {
      try {
        const cachePath = path.join(CACHE_DIR, `surah_${surahNumber}.json`);
        if (fs.existsSync(cachePath)) {
          const cachedData = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
          const foundVerse = cachedData?.verses?.find((v: any) => v.numberInSurah === Number(verseNumber));
          if (foundVerse?.tafsir) resolvedTafsir = foundVerse.tafsir;
        }
      } catch {
        // ignore local cache lookup error
      }
    }
  }

  const generateVerseContextFallback = () =>
    generateLocalVerseContext({
      surahName: String(surahName || surahNumber || ""),
      surahNumber: Number(surahNumber || 1),
      verseNumber: Number(verseNumber || 1),
      verseText: String(verseText || ""),
      tafsir: resolvedTafsir,
    });

  if (isGeminiApiKeyMissing()) {
    return res.json({ result: generateVerseContextFallback() });
  }

  try {
    const systemPrompt = `أنت مفسر قرآن قدير ومؤرخ إسلامي موثوق، تمتلك معرفة شاسعة بأسباب النزول المعتمدة (ككتاب أسباب النزول للواحدي ولباب النقول للسيوطي) ومقاصد الآيات والتفسير اللغوي والعقدي والتربوي.
مهمتك هي تقديم بيان وافٍ ومنسق عبر Markdown حول:
1. سبب نزول الآية المباركة (إن صحّ فيها سبب نزول مأثور، أو بيان سياقها الموضوعي ومناسبتها لما قبلها إن لم يرد سبب نزول خاص).
2. المعنى الإجمالي واللطائف البلاغية والتفسيرية في الآية.
3. الدروس والعبر التربوية والاجتماعية المستوحاة منها.
اكتب باللغة العربية الفصحى البليغة فقط دون أي مقدمات تقنية.`;

    const userPrompt = `السورة: ${surahName || surahNumber} (رقمها: ${surahNumber})، الآية رقم: ${verseNumber}.
نص الآية الكريمة: "${verseText}"${resolvedTafsir ? `\nتفسير الجلالين للآية: "${resolvedTafsir}"` : ""}`;

    const response = await generateGeminiContent({
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
      }
    });
    const resultText = response.text || generateVerseContextFallback();
    aiResponseCache.set(cacheKey, resultText);
    res.json({ result: resultText });
  } catch (error: any) {
    console.error("Gemini Verse Context analysis error:", error.message);
    res.json({ result: generateVerseContextFallback() });
  }
});

// 5. AI Story Pondering & Lessons extractor
app.post("/api/ai/story-ponder", async (req, res) => {
  const { storyTitle, storyNarrative, prompt } = req.body;

  if (!storyTitle) {
    return res.status(400).json({ error: "اسم القصة مفقود." });
  }

  const cacheKey = `story-ponder:${storyTitle}:${prompt || "default"}`;
  if (aiResponseCache.has(cacheKey)) {
    return res.json({ result: aiResponseCache.get(cacheKey) });
  }

  const generateStoryFallback = () =>
    generateLocalStoryPonder({ storyTitle, storyNarrative, prompt });

  if (isGeminiApiKeyMissing()) {
    return res.json({ result: generateStoryFallback() });
  }

  try {
    const systemPrompt = `أنت عالم وموجّه تربوي وإيماني متميز متخصص في تفسير وتدبر وتحليل القصص القرآني المذكور في كتاب الله الشريف بأسلوب يلامس القلوب ويسهل تطبيقه عملياً في واقعنا الحديث.
مهمتك هي تلقي قصة قرآنية معينة (اسم القصة وتفاصيلها)، وسؤال أو طلب تدبر من المستخدم حولها، وتقديم استجابة وافية وبليغة تلامس النفوس، مع استنباط الدروس والوصايا العملية والنفسية والاجتماعية.
1. صِغ الرد بلغة عربية فصحى بالغة الرقي والأناقة.
2. نسق الرد عبر Markdown (عناوين، نقاط، اقتباسات قرآنية).
3. تجنب أي مقدمات تقنية وابدأ مباشرة في الموضوع.`;

    const userPrompt = `اسم القصة: "${storyTitle}"
ملخص القصة: "${storyNarrative}"
${prompt ? `سؤال المستخدم حول القصة: "${prompt}"` : "أريد تدبراً معمقاً وشاملاً لهذه القصة، مع استنباط الدروس والفوائد والخطوات العملية التي يمكن تفعيلها في حياتي اليومية."}`;

    const response = await generateGeminiContent({
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    const resultText = response.text || generateStoryFallback();
    aiResponseCache.set(cacheKey, resultText);
    res.json({ result: resultText });
  } catch (error: any) {
    console.error("Gemini AI Story Ponder error:", error.message);
    res.json({ result: generateStoryFallback() });
  }
});

// XML Sitemap HTTP endpoint serving the static file from the public/dist directory
app.get("/sitemap.xml", (req, res) => {
  const pathsToTry = [
    path.join(process.cwd(), "dist", "sitemap.xml"),
    path.join(process.cwd(), "public", "sitemap.xml"),
    path.join(process.cwd(), "sitemap.xml")
  ];
  
  let filePath = "";
  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }
  
  if (filePath) {
    try {
      let content = fs.readFileSync(filePath, "utf-8");
      
      // Strip any byte-order mark (BOM) if present
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      
      // Trim leading and trailing whitespace to ensure first line starts exactly with the xml declaration
      content = content.trim();
      
      // Keep static URLs absolutely matched to the primary domain: https://qurany.xyz
      // By replacing any other hostname inside <loc> matches
      content = content.replace(/<loc>https?:\/\/[^\/]+/g, "<loc>https://qurany.xyz");

      // Log the first 200 characters of sitemap response to verify it starts exactly with xml declaration
      console.log("=== SITEMAP XML RESPONDING START (FIRST 200 CHARS) ===");
      console.log(content.substring(0, 200));
      console.log("======================================================");

      res.header("Content-Type", "application/xml; charset=utf-8");
      res.header("X-Content-Type-Options", "nosniff");
      res.header("X-Robots-Tag", "index, follow");
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Cache-Control", "no-cache, no-store, must-revalidate");
      res.header("Pragma", "no-cache");
      res.header("Expires", "0");
      res.header("Content-Length", String(Buffer.byteLength(content, "utf-8")));
      
      return res.status(200).send(content);
    } catch (err: any) {
      console.error("Error reading sitemap file:", err);
      return res.status(500).send("Internal server error");
    }
  }
  res.status(404).header("Content-Type", "text/plain").send("Sitemap not found");
});

// Provide a backup routing in case crawler queries "/sitemap"
app.get("/sitemap", (req, res) => {
  res.redirect(301, "/sitemap.xml");
});

// robots.txt with absolute indexing and api route prevention serving the static file
app.get("/robots.txt", (req, res) => {
  const pathsToTry = [
    path.join(process.cwd(), "dist", "robots.txt"),
    path.join(process.cwd(), "public", "robots.txt"),
    path.join(process.cwd(), "robots.txt")
  ];

  let filePath = "";
  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (filePath) {
    try {
      let content = fs.readFileSync(filePath, "utf-8");
      
      // Strip any byte-order mark (BOM) if present
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      content = content.trim();

      // Ensure that robots.txt sitemap reference points to the absolute canonical domain
      content = content.replace(/Sitemap:\s*https?:\/\/[^\/]+/gi, "Sitemap: https://qurany.xyz");

      // Log the first 200 characters of robots.txt response
      console.log("=== ROBOTS.TXT RESPONDING START (FIRST 200 CHARS) ===");
      console.log(content.substring(0, 200));
      console.log("=====================================================");

      res.header("Content-Type", "text/plain; charset=utf-8");
      res.header("X-Robots-Tag", "index, follow");
      res.header("Cache-Control", "public, max-age=86400"); // Cache config for crawlers for 1 day
      res.header("Content-Length", String(Buffer.byteLength(content, "utf-8")));
      
      return res.status(200).send(content);
    } catch (err: any) {
      console.error("Error reading robots.txt file:", err);
      return res.status(500).send("Internal server error");
    }
  }
  res.status(404).header("Content-Type", "text/plain").send("Robots.txt not found");
});

// Setup Vite Dev Server / Static Assets & Serverless Handlers
const isVercel = Boolean(process.env.VERCEL);
const isProd = isVercel || process.env.NODE_ENV === "production";

let cachedIndexHtml: string | null = null;

function getBaseIndexHtml(distPath: string): string {
  if (cachedIndexHtml) return cachedIndexHtml;

  const candidatePaths = [
    path.join(distPath, "index.html"),
    path.join(process.cwd(), "dist", "index.html"),
    path.join(__dirname, "dist", "index.html"),
    path.join(__dirname, "../dist", "index.html"),
    path.join(process.cwd(), "index.html"),
    path.join(__dirname, "index.html")
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, "utf-8");
        if (content && (content.includes("id=\"root\"") || content.includes("id='root'"))) {
          cachedIndexHtml = content;
          return content;
        }
      } catch (err: any) {
        console.warn(`Could not read index template from ${p}:`, err.message);
      }
    }
  }

  // Self-contained fallback that boots the React app gracefully
  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>قرآني (Qurany) | المصحف الإلكتروني وتلاوة وتدبر ذكي</title>
    <meta name="description" content="موقع قرآني: مصحف إلكتروني شامل مخصص لقراءة وتلاوة وتدبر القرآن الكريم ببراعة وسلاسة." />
    <link rel="canonical" href="https://qurany.xyz/" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/png" href="/icon.png" />
  </head>
  <body>
    <div id="root">
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0c0a09;color:#f59e0b;font-family:sans-serif;font-size:1.25rem;">
        جاري فتح المصحف الشريف...
      </div>
    </div>
  </body>
</html>`;
}

function mountProductionHandlers() {
  const distPath = path.join(process.cwd(), "dist");

  // Serve static assets directly from dist/
  app.use(express.static(distPath, { index: false }));

  app.get("*", (req, res) => {
    // If requesting a specific static file that exists, serve it directly
    if (req.path !== "/" && req.path !== "/index.html") {
      const fileLoc = path.join(distPath, req.path);
      if (fs.existsSync(fileLoc)) {
        return res.sendFile(fileLoc);
      }
    }

    try {
      let html = getBaseIndexHtml(distPath);

      const host = req.get("host") || "qurany.xyz";
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const currentUrl = `${protocol}://${host}${req.originalUrl}`;
      const baseDomain = `${protocol}://${host}`;

      let sNum = NaN;
      let tabQuery: string | null = null;

      const pathParts = req.path.split("/").filter(Boolean);
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

      // Apply dynamic SEO tag transformations
      html = html.replace(/<title>[^<]*<\/title>/g, `<title>${title}</title>`);
      html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/gi, `<meta name="description" content="${desc}" />`);
      html = html.replace(/<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/gi, `<meta name="keywords" content="${keywords}" />`);
      html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/gi, `<link rel="canonical" href="${currentUrl}" />`);
      html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/gi, `<meta property="og:url" content="${currentUrl}" />`);
      html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/gi, `<meta property="og:title" content="${title}" />`);
      html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/gi, `<meta property="og:description" content="${desc}" />`);
      html = html.replace(/<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/gi, `<meta name="twitter:url" content="${currentUrl}" />`);
      html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/gi, `<meta name="twitter:title" content="${title}" />`);
      html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/gi, `<meta name="twitter:description" content="${desc}" />`);
      html = html.replaceAll("https://service-22577922415.europe-west2.run.app/", `${baseDomain}/`);
      html = html.replaceAll("https://service-22577922415.europe-west2.run.app", baseDomain);

      return res.status(200).send(html);
    } catch (err: any) {
      console.error("Error serving and compiling dynamic SEO tags:", err?.message || err);
      return res.status(200).send(getBaseIndexHtml(distPath));
    }
  });
}

async function startServer() {
  if (isProd) {
    mountProductionHandlers();
  } else {
    try {
      const { createServer } = await import("vite");
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);

      // In dev mode, handle SPA HTML routing with Vite transformIndexHtml
      app.use("*", async (req, res, next) => {
        if (req.path.startsWith("/api/")) {
          return next();
        }
        try {
          const indexPath = path.resolve(process.cwd(), "index.html");
          if (fs.existsSync(indexPath)) {
            let template = fs.readFileSync(indexPath, "utf-8");
            template = await vite.transformIndexHtml(req.originalUrl, template);
            return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(template);
          }
          next();
        } catch (e: any) {
          vite.ssrFixStacktrace(e);
          next(e);
        }
      });
    } catch (err) {
      console.error("Failed to start Vite middleware in dev:", err);
    }
  }

  // Start standalone HTTP listener only when NOT running as a serverless function (Vercel)
  if (!isVercel) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT} with environment ${process.env.NODE_ENV || 'development'}`);
    });
  }
}

startServer();

export default app;

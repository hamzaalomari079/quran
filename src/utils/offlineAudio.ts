/**
 * Utility functions for caching Quran recitation audios offline
 * using the Web Cache Storage API.
 */

// Helper to pad numbers (same as used in AudioPlayer.tsx)
export function getEveryAyahUrl(reciterIdentifier: string, surahNum: number, verseNum: number): string {
  const padSurah = String(surahNum).padStart(3, "0");
  const padAyah = String(verseNum).padStart(3, "0");
  return `https://www.everyayah.com/data/${reciterIdentifier}/${padSurah}${padAyah}.mp3`;
}

// Open or get the Quran audio cache
export async function getAudioCache(): Promise<Cache | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;
  try {
    return await caches.open("quran_audio_cache");
  } catch (err) {
    console.error("Failed to open cache storage:", err);
    return null;
  }
}

// Download and cache all verse audio files for a Surah and a specific reciter
export async function cacheSurahAudios(
  surahNum: number,
  totalAyahs: number,
  reciterIdentifier: string,
  onProgress?: (downloaded: number, total: number) => void
): Promise<boolean> {
  const cache = await getAudioCache();
  if (!cache) return false;

  let downloadedCount = 0;

  for (let verseNum = 1; verseNum <= totalAyahs; verseNum++) {
    const audioUrl = getEveryAyahUrl(reciterIdentifier, surahNum, verseNum);
    
    // Check if already is cached to save bandwidth
    try {
      const alreadyCached = await cache.match(audioUrl);
      if (alreadyCached) {
        downloadedCount++;
        if (onProgress) onProgress(downloadedCount, totalAyahs);
        continue;
      }
    } catch (e) {
      console.warn("Cache check error for verse " + verseNum, e);
    }

    try {
      // Fetch with cors
      const response = await fetch(audioUrl, {
        method: "GET",
        mode: "cors" // EveryAyah supports CORS
      });

      if (response.ok) {
        await cache.put(audioUrl, response);
        downloadedCount++;
        if (onProgress) onProgress(downloadedCount, totalAyahs);
      } else {
        throw new Error(`Failed to fetch ${audioUrl}: ${response.statusText}`);
      }
    } catch (err) {
      console.warn(`Failed to download audio for verse ${verseNum}:`, err);
      // We can continue to cache as much as possible rather than failing immediately
    }
  }

  return downloadedCount > 0;
}

// Check if a Surah's audios are cached fully for a particular reciter
export async function isSurahAudioCached(
  surahNum: number,
  totalAyahs: number,
  reciterIdentifier: string
): Promise<boolean> {
  const cache = await getAudioCache();
  if (!cache) return false;

  try {
    for (let verseNum = 1; verseNum <= totalAyahs; verseNum++) {
      const audioUrl = getEveryAyahUrl(reciterIdentifier, surahNum, verseNum);
      const cached = await cache.match(audioUrl);
      if (!cached) return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Remove cached audios of a Surah for a specific reciter
export async function removeCachedSurahAudios(
  surahNum: number,
  totalAyahs: number,
  reciterIdentifier: string
): Promise<void> {
  const cache = await getAudioCache();
  if (!cache) return;

  try {
    for (let verseNum = 1; verseNum <= totalAyahs; verseNum++) {
      const audioUrl = getEveryAyahUrl(reciterIdentifier, surahNum, verseNum);
      await cache.delete(audioUrl);
    }
  } catch (e) {
    console.error("Failed to delete cached audio:", e);
  }
}

// Clear all audio caches
export async function clearAllAudioCache(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;
  try {
    return await caches.delete("quran_audio_cache");
  } catch (err) {
    console.error("Failed to delete cache storage:", err);
    return false;
  }
}

import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Settings, Disc, Info, X } from "lucide-react";
import { Reciter, recitersList } from "../types";

interface AudioPlayerProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentPlayingVerse: {
    surahNumber: number;
    verseNumber: number;
    surahName: string;
    totalAyahs: number;
  } | null;
  onNextVerse: () => void;
  onPrevVerse: () => void;
  activeReciter: Reciter;
  setActiveReciter: (r: Reciter) => void;
  isFocusReadingMode?: boolean;
  onClose?: () => void;
}

export default function AudioPlayer({
  isPlaying,
  setIsPlaying,
  currentPlayingVerse,
  onNextVerse,
  onPrevVerse,
  activeReciter,
  setActiveReciter,
  isFocusReadingMode = false,
  onClose,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showReciters, setShowReciters] = useState(false);

  // Generate deterministic audio URL from EveryAyah.com
  const getAudioUrl = () => {
    if (!currentPlayingVerse) return "";
    const padSurah = String(currentPlayingVerse.surahNumber).padStart(3, "0");
    const padAyah = String(currentPlayingVerse.verseNumber).padStart(3, "0");
    return `https://www.everyayah.com/data/${activeReciter.identifier}/${padSurah}${padAyah}.mp3`;
  };

  const [activeAudioSource, setActiveAudioSource] = useState<string>("");

  // Check if there is cached offline audio file and return resource Blob URL
  useEffect(() => {
    let active = true;
    let objectUrlToRevoke: string | null = null;

    const updateAudioSource = async () => {
      const url = getAudioUrl();
      if (!url) {
        if (active) setActiveAudioSource("");
        return;
      }

      try {
        if (typeof window !== 'undefined' && 'caches' in window) {
          const cache = await caches.open("quran_audio_cache");
          const cachedResponse = await cache.match(url);
          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            const blobUrl = URL.createObjectURL(blob);
            objectUrlToRevoke = blobUrl;
            if (active) {
              setActiveAudioSource(blobUrl);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Error reading audio from Cache API:", err);
      }

      if (active) {
        setActiveAudioSource(url);
      }
    };

    updateAudioSource();
    return () => {
      active = false;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [currentPlayingVerse, activeReciter]);

  useEffect(() => {
    // Re-create or update audio element when playing verse or reciter changes or activeAudioSource updates
    if (!currentPlayingVerse || !activeAudioSource) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(activeAudioSource);
    } else {
      audioRef.current.src = activeAudioSource;
    }

    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current.playbackRate = playbackSpeed;
    audioRef.current.loop = isLooping;

    // Load handlers
    const onTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };

    const onLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };

    const onEnded = () => {
      if (isLooping) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.error("Audio replay error", e));
        }
      } else {
        onNextVerse();
      }
    };

    const onError = (e: any) => {
      console.warn("Audio file failed to load, trying alternative", e);
      // Quietly advance or notify if real error
    };

    audioRef.current.addEventListener("timeupdate", onTimeUpdate);
    audioRef.current.addEventListener("loadedmetadata", onLoadedMetadata);
    audioRef.current.addEventListener("ended", onEnded);
    audioRef.current.addEventListener("error", onError);

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.log("Playback interrupted or deferred:", err.message);
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", onTimeUpdate);
        audioRef.current.removeEventListener("loadedmetadata", onLoadedMetadata);
        audioRef.current.removeEventListener("ended", onEnded);
        audioRef.current.removeEventListener("error", onError);
      }
    };
  }, [currentPlayingVerse, activeReciter, activeAudioSource]);

  // Handle Play/Pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error("Audio playback failed", err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Volume effects
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Playback Speed effects
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  if (!currentPlayingVerse) return null;

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCurrentTime(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div id="audio-player-container" className={`fixed ${isFocusReadingMode ? "bottom-0" : "bottom-[68px] md:bottom-0"} left-0 right-0 z-40 md:z-50 bg-stone-900/98 backdrop-blur-md border-t border-stone-850 shadow-[0_-8px_32px_rgba(0,0,0,0.85)] pl-11 pr-4 py-3 md:py-3.5 transition-all duration-300`}>
      
      {/* Absolute Close Option 'X' Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2.5 left-3 sm:top-3 sm:left-4.5 z-55 p-1 rounded-full bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-rose-400 transition-colors border border-stone-800 cursor-pointer shadow-md flex items-center justify-center hover:scale-105 active:scale-95"
          title="إغلاق وإزالة مشغل التلاوة ماتا"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Mini top progress indicator on mobile screens */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-1 bg-stone-800">
        <div 
          className="bg-amber-500 h-full transition-all duration-200 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
          style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
        ></div>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        
        {/* ROW 1 (On mobile): Info and Compact Mobile Reciter Selector */}
        <div className="flex items-center justify-between w-full md:w-1/4 min-w-0 gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1 select-all">
            <div className="w-8 h-8 rounded-full bg-stone-850 border border-stone-800 flex items-center justify-center text-amber-500 shrink-0 animate-spin-slow shadow-inner">
              <Disc className="w-4 h-4 text-[#c49a6c]" />
            </div>
            <div className="text-right min-w-0 flex-1">
              <h4 className="text-xs md:text-sm font-black text-stone-100 font-sans truncate">
                سورة {currentPlayingVerse.surahName}
              </h4>
              <p className="text-[10.5px] md:text-xs text-stone-400 font-sans mt-0.5 truncate" dir="rtl">
                الآية {currentPlayingVerse.verseNumber} <span className="hidden xs:inline">من {currentPlayingVerse.totalAyahs}</span> • <span className="text-amber-500/95 font-semibold">{activeReciter.name}</span>
              </p>
            </div>
          </div>

          {/* Compact Mobile Reciter Selection Button */}
          <div className="relative md:hidden shrink-0">
            <button
              onClick={() => setShowReciters(!showReciters)}
              className="px-2.5 py-1.5 rounded-xl border border-stone-800 bg-stone-850 text-[10px] font-bold text-stone-300 hover:bg-stone-800 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <Settings className="w-3 h-3 text-amber-500 shrink-0" />
              <span>القارئ</span>
            </button>

            {showReciters && (
              <div className="absolute bottom-full mb-2 left-0 bg-stone-900 border border-amber-500/20 rounded-2xl shadow-2xl py-2 w-52 z-55 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="px-3 py-1.5 border-b border-stone-850 text-[10px] font-black text-amber-500 tracking-wider text-right">
                  اختر قارئ التلاوة
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {recitersList.map((reciter) => (
                    <button
                      key={reciter.id}
                      onClick={() => {
                        setActiveReciter(reciter);
                        setShowReciters(false);
                      }}
                      className={`w-full text-right px-4 py-2.5 hover:bg-stone-800 text-[11px] flex flex-col gap-0.5 cursor-pointer ${
                        activeReciter.id === reciter.id ? "bg-amber-600/10 text-amber-400 font-bold" : "text-stone-300"
                      }`}
                    >
                      <span className="font-bold">{reciter.name}</span>
                      <span className="text-[9px] text-stone-450 font-normal">{reciter.subtext}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ROW 2 (On mobile): Navigation Buttons, Loop, Playback options */}
        <div className="flex items-center justify-between md:justify-center gap-4 w-full md:w-2/4 md:flex-initial">
          
          {/* Looping Toggle on mobile */}
          <button
            onClick={() => {
              setIsLooping(!isLooping);
              if (audioRef.current) {
                audioRef.current.loop = !isLooping;
              }
            }}
            className={`p-2 rounded-xl transition-all border cursor-pointer md:hidden ${
              isLooping 
                ? "bg-amber-600/15 border-amber-500/35 text-amber-500" 
                : "text-stone-400 hover:text-stone-200 border-stone-850"
            }`}
            title="تكرار الآية الحالية"
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Center Playback navigation controls */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 flex-1 md:flex-initial">
            <button
              onClick={onPrevVerse}
              className="p-2 rounded-full text-stone-400 hover:text-amber-500 hover:bg-stone-850 transition-colors cursor-pointer select-none"
              title="الآية السابقة"
            >
              <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              onClick={handlePlayPause}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-600 flex items-center justify-center text-stone-950 font-extrabold hover:shadow-lg hover:shadow-amber-500/10 hover:bg-amber-500 active:scale-95 transition-all outline-none cursor-pointer shrink-0 select-none"
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-stone-950 stroke-stone-950" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-stone-950 stroke-stone-950 ml-0.5" />}
            </button>

            <button
              onClick={onNextVerse}
              className="p-2 rounded-full text-stone-400 hover:text-amber-500 hover:bg-stone-850 transition-colors cursor-pointer select-none"
              title="الآية التالية"
            >
              <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Speed settings toggle on mobile */}
          <div className="md:hidden shrink-0">
            <button
              onClick={() => {
                const nextSpeed = playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : playbackSpeed === 1.5 ? 2.0 : 1;
                setPlaybackSpeed(nextSpeed);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-stone-850 text-[10px] font-bold text-stone-400 hover:text-stone-200 cursor-pointer active:scale-95 transition-all"
              title="سرعة تلاوة الآية"
            >
              <span>{playbackSpeed}x ⚡</span>
            </button>
          </div>

          {/* Time Scrubber (hidden on mobile, shown on desktop) */}
          <div className="hidden md:flex items-center gap-2.5 w-full text-xs text-stone-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSliderChange}
              className="w-full accent-amber-500 bg-stone-800 rounded-lg appearance-none h-1.5 cursor-pointer outline-none"
            />
            <span>{formatTime(duration)}</span>
          </div>

        </div>

        {/* Desktop ONLY: Volume and Desktop Reciter Selector */}
        <div className="hidden md:flex items-center justify-end gap-3 flex-1 md:w-1/4 select-none relative">
          
          {/* Looping Toggle */}
          <button
            onClick={() => {
              setIsLooping(!isLooping);
              if (audioRef.current) {
                audioRef.current.loop = !isLooping;
              }
            }}
            className={`p-2 rounded-lg transition-colors border cursor-pointer ${
              isLooping 
                ? "bg-amber-600/15 border-amber-500/35 text-amber-500" 
                : "text-stone-400 hover:text-stone-200 border-transparent"
            }`}
            title="تكرار الآية الحالية"
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Reciter Selector dropdown toggler */}
          <div className="relative">
            <button
              onClick={() => setShowReciters(!showReciters)}
              className="px-3 py-1.5 rounded-lg border border-stone-800 bg-stone-850 text-xs font-medium text-stone-300 hover:bg-stone-800 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>أختر القارئ</span>
            </button>

            {showReciters && (
              <div className="absolute bottom-full mb-2 right-0 bg-stone-900 border border-stone-800 rounded-xl shadow-2xl py-2 w-56 z-55 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="px-3 py-1.5 border-b border-stone-850 text-[10px] font-bold text-amber-500 tracking-wider uppercase text-right">
                  اختر قارئ التلاوة
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {recitersList.map((reciter) => (
                    <button
                      key={reciter.id}
                      onClick={() => {
                        setActiveReciter(reciter);
                        setShowReciters(false);
                      }}
                      className={`w-full text-right px-4 py-2 hover:bg-stone-800 text-xs flex flex-col gap-0.5 cursor-pointer ${
                        activeReciter.id === reciter.id ? "bg-amber-600/10 text-amber-500 font-bold" : "text-stone-300"
                      }`}
                    >
                      <span>{reciter.name}</span>
                      <span className="text-[10px] text-stone-450 font-normal">{reciter.subtext}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                if (val > 0) setIsMuted(false);
              }}
              className="w-20 accent-amber-500 bg-stone-850 rounded-lg appearance-none h-1 cursor-pointer outline-none"
            />
          </div>

        </div>

      </div>
    </div>
  );
}

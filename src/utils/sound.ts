/**
 * Divine/Spiritual Chime Sound Synthesizer using standard Web Audio API.
 * Synthesizes a beautiful, gentle double-gong singing bowl chime for Quranic reminders.
 * Completely client-side, zero assets, zero network latency, and works on all modern devices.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes a high-quality, acoustic resonance sound.
 * @param frequency Base tone frequency in Hz (e.g. 392 for G4)
 * @param duration Duration of the decay in seconds
 * @param volume Master gain volume (0.0 to 1.0)
 * @param delay Start delay in seconds
 */
function playResonanceTone(ctx: AudioContext, frequency: number, duration: number, volume: number, delay: number) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator(); // Overtone
  const osc3 = ctx.createOscillator(); // Subtone
  
  const gainNode = ctx.createGain();
  
  // High-frequency overtone for metallic sparkle
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  
  // Golden ratio harmony overtone (perfect fifth or third)
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(frequency * 1.5, ctx.currentTime + delay);
  
  // Warm lower octave subharmonic
  osc3.type = "sine";
  osc3.frequency.setValueAtTime(frequency * 0.5, ctx.currentTime + delay);

  // Combine
  osc1.connect(gainNode);
  osc2.connect(gainNode);
  osc3.connect(gainNode);
  
  gainNode.connect(ctx.destination);

  // Fine-tuned volume envelope for spiritual gong reflection
  const gain = gainNode.gain;
  gain.setValueAtTime(0, ctx.currentTime + delay);
  
  // Gentle attack: prevent click sound
  gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + delay + 0.08);
  
  // Extra subtle swell
  gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + delay + 0.15);
  
  // Exponential decay for beautiful authentic tail
  gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  // Schedule stop
  osc1.start(ctx.currentTime + delay);
  osc2.start(ctx.currentTime + delay);
  osc3.start(ctx.currentTime + delay);
  
  osc1.stop(ctx.currentTime + delay + duration + 0.5);
  osc2.stop(ctx.currentTime + delay + duration + 0.5);
  osc3.stop(ctx.currentTime + delay + duration + 0.5);
}

/**
 * Plays a luxurious double-pitch spiritual gong chime (e.g., C5 and G5 harmony)
 * that is dually aesthetic, warm, eyes-safe and sound-friendly.
 */
export function playSpiritualChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // First note: Warm Low bell tone (A4 at 440Hz / G4 at 392Hz)
    playResonanceTone(ctx, 392, 2.5, 0.4, 0);

    // Second note: Celestial matching high tone (D5 at 587.3Hz) starting 0.4s later
    playResonanceTone(ctx, 587.33, 3.0, 0.35, 0.45);
  } catch (err) {
    console.warn("Web Audio API Chime playback failed:", err);
  }
}

import { useSyncExternalStore } from "react";

/**
 * Sounds for the interactive strike dividers. The clips live in
 * `public/audio/strikes/`; their sources and licences are in `CREDITS.md`
 * there. A PERFECT press reuses the stab clip, pitched up, as a short ring.
 */
export type StrikeSound = "slash" | "stab" | "finisher" | "miss";

const SOURCES: Record<StrikeSound, string> = {
  slash: "/audio/strikes/slash.wav",
  stab: "/audio/strikes/stab.wav",
  finisher: "/audio/strikes/finisher.wav",
  miss: "/audio/strikes/miss.wav",
};

/** localStorage key holding "1" while strike sounds are muted. */
const MUTE_KEY = "portfolio_strike_muted";

let context: AudioContext | null = null;
/** Raw clip bytes, fetched ahead of the first press. */
const downloads = new Map<StrikeSound, Promise<ArrayBuffer | null>>();
/** Decoded clips, available once audio is unlocked. */
const decoded = new Map<StrikeSound, Promise<AudioBuffer | null>>();
const muteListeners = new Set<() => void>();

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

let muted: boolean | null = null;

function getMuted() {
  if (muted === null) muted = readMuted();
  return muted;
}

export function setStrikeMuted(next: boolean) {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    // Storage blocked: the choice lasts until reload.
  }
  muteListeners.forEach((listener) => listener());
}

/** Whether strike sounds are muted. `false` on the server and during hydration. */
export function useStrikeMuted(): boolean {
  return useSyncExternalStore(
    (listener) => {
      muteListeners.add(listener);
      return () => {
        muteListeners.delete(listener);
      };
    },
    getMuted,
    () => false,
  );
}

/**
 * Starts downloading the clips without touching audio, so the first press is
 * not silent. Call on hover or focus of a STRIKE button. Safe to call repeatedly.
 */
export function preloadStrikeAudio() {
  if (typeof window === "undefined") return;
  (Object.keys(SOURCES) as StrikeSound[]).forEach((name) => {
    if (downloads.has(name)) return;
    downloads.set(
      name,
      fetch(SOURCES[name])
        .then((response) => (response.ok ? response.arrayBuffer() : null))
        .catch(() => null),
    );
  });
}

/**
 * Creates the audio context and decodes the clips. Must be called from inside a
 * user gesture (a click or key press): browsers keep audio locked until then,
 * and creating the context earlier logs a warning. Safe to call on every press.
 * A clip that fails to download or decode stays silent.
 */
export function unlockStrikeAudio() {
  if (typeof window === "undefined" || !("AudioContext" in window)) return;
  preloadStrikeAudio();
  if (context) {
    if (context.state === "suspended") void context.resume();
    return;
  }
  const audio = new AudioContext();
  context = audio;
  (Object.keys(SOURCES) as StrikeSound[]).forEach((name) => {
    decoded.set(
      name,
      downloads
        .get(name)!
        .then((bytes) => (bytes ? audio.decodeAudioData(bytes.slice(0)) : null))
        .catch(() => null),
    );
  });
}

/**
 * Plays a clip if audio is unlocked and sound is not muted. `volume` is 0–1;
 * `rate` above 1 plays faster and higher-pitched. A clip still decoding when
 * requested plays as soon as it is ready, unless that takes over 250 ms.
 */
export function playStrikeSound(name: StrikeSound, { volume = 1, rate = 1 } = {}) {
  const audio = context;
  const pending = decoded.get(name);
  if (!audio || !pending || getMuted()) return;
  const requested = performance.now();
  void pending.then((buffer) => {
    if (!buffer || getMuted() || performance.now() - requested > 250) return;
    const source = audio.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const gain = audio.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(audio.destination);
    source.start();
  });
}

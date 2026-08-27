type AudioContextCtor = typeof AudioContext;

type GainLike = {
  gain: {
    setValueAtTime: (value: number, time: number) => void;
    exponentialRampToValueAtTime: (value: number, time: number) => void;
  };
  connect: (dest: unknown) => void;
};

type OscillatorLike = {
  type: string;
  frequency: { value: number };
  connect: (dest: unknown) => void;
  start: (time: number) => void;
  stop: (time: number) => void;
};

export type TimerAudioContext = {
  state: string;
  currentTime: number;
  destination: unknown;
  resume: () => Promise<void>;
  createOscillator: () => OscillatorLike;
  createGain: () => GainLike;
};

let ctx: TimerAudioContext | null = null;
let testFactory: (() => TimerAudioContext | null) | undefined;

export const TIMER_CHIME_NOTES = [
  { frequency: 880, offset: 0, duration: 0.12 },
  { frequency: 880, offset: 0.18, duration: 0.12 },
  { frequency: 1318.5, offset: 0.36, duration: 0.28 },
] as const;

function audioContextCtor(): AudioContextCtor | undefined {
  if (typeof window === "undefined") return undefined;
  return window.AudioContext ?? (window as Window & { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
}

function getContext(): TimerAudioContext | null {
  if (testFactory) return testFactory();
  const Ctor = audioContextCtor();
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor() as unknown as TimerAudioContext;
  return ctx;
}

export function setTimerSoundContextForTests(factory?: () => TimerAudioContext | null) {
  testFactory = factory;
  if (!factory) ctx = null;
}

export async function unlockTimerSound() {
  const audio = getContext();
  if (!audio) return;
  if (audio.state === "suspended") {
    try {
      await audio.resume();
    } catch {
      /* iOS may reject until a later gesture */
    }
  }
}

function tone(audio: TimerAudioContext, frequency: number, start: number, duration: number) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.2, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

export function playTimerDone() {
  const audio = getContext();
  if (!audio) return;
  void audio
    .resume()
    .then(() => {
      const t = audio.currentTime;
      for (const note of TIMER_CHIME_NOTES) {
        tone(audio, note.frequency, t + note.offset, note.duration);
      }
    })
    .catch(() => {
      /* autoplay blocked — unlock on the next Lift tap */
    });
}

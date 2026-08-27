import { afterEach, describe, expect, it, vi } from "vitest";
import {
  playTimerDone,
  setTimerSoundContextForTests,
  TIMER_CHIME_NOTES,
  unlockTimerSound,
  type TimerAudioContext,
} from "./timerSound";

function mockContext(state = "running") {
  const started: { frequency: number; start: number; stop: number }[] = [];
  const resume = vi.fn(async () => undefined);
  const audio: TimerAudioContext = {
    state,
    currentTime: 4,
    destination: {},
    resume,
    createGain: () => ({
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    }),
    createOscillator: () => {
      const osc = {
        type: "sine",
        frequency: { value: 0 },
        connect: vi.fn(),
        start: (time: number) => {
          started.push({ frequency: osc.frequency.value, start: time, stop: 0 });
        },
        stop: (time: number) => {
          const last = started[started.length - 1];
          if (last) last.stop = time;
        },
      };
      return osc;
    },
  };
  return { audio, started, resume };
}

describe("timerSound", () => {
  afterEach(() => {
    setTimerSoundContextForTests();
  });

  it("defines a three-note done chime", () => {
    expect(TIMER_CHIME_NOTES).toHaveLength(3);
    expect(TIMER_CHIME_NOTES[2]?.frequency).toBeGreaterThan(TIMER_CHIME_NOTES[0]?.frequency ?? 0);
  });

  it("does nothing when Web Audio is unavailable", () => {
    setTimerSoundContextForTests(() => null);
    expect(() => playTimerDone()).not.toThrow();
  });

  it("resumes a suspended context on unlock", async () => {
    const { audio, resume } = mockContext("suspended");
    setTimerSoundContextForTests(() => audio);
    await unlockTimerSound();
    expect(resume).toHaveBeenCalledOnce();
  });

  it("plays the chime notes after resume", async () => {
    const { audio, started, resume } = mockContext("running");
    setTimerSoundContextForTests(() => audio);
    playTimerDone();
    await Promise.resolve();
    expect(resume).toHaveBeenCalled();
    expect(started.map((note) => note.frequency)).toEqual(TIMER_CHIME_NOTES.map((note) => note.frequency));
    expect(started[0]?.start).toBe(4);
  });
});

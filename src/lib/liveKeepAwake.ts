/** Keep a live run/walk page from auto-sleeping so GPS can keep sampling. */

type WakeLockSentinel = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
};

function wavDataUri() {
  const sampleRate = 8000;
  const seconds = 2;
  const samples = sampleRate * seconds;
  const bytes = 44 + samples * 2;
  const buffer = new ArrayBuffer(bytes);
  const view = new DataView(buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  ascii(0, "RIFF");
  view.setUint32(4, bytes - 8, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i += 1) {
    const tick = i % sampleRate === 0 ? 12 : 0;
    view.setInt16(44 + i * 2, tick, true);
  }
  const bytesArray = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytesArray.length; i += 1) binary += String.fromCharCode(bytesArray[i]!);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function attachHiddenMedia(el: HTMLMediaElement) {
  el.setAttribute("playsinline", "true");
  el.setAttribute("webkit-playsinline", "true");
  el.loop = true;
  el.autoplay = true;
  if ("playsInline" in el) (el as HTMLVideoElement).playsInline = true;
  el.style.position = "fixed";
  el.style.width = "1px";
  el.style.height = "1px";
  el.style.opacity = "0";
  el.style.pointerEvents = "none";
  el.setAttribute("aria-hidden", "true");
  document.body.appendChild(el);
}

export function startLiveKeepAwake(label = "Live GPS"): () => void {
  if (typeof document === "undefined") return () => undefined;

  let stopped = false;
  let sentinel: WakeLockSentinel | null = null;
  const audio = document.createElement("audio");
  audio.src = wavDataUri();
  audio.volume = 0.01;
  attachHiddenMedia(audio);
  audio.muted = false;

  const video = document.createElement("video");
  video.muted = true;
  attachHiddenMedia(video);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext("2d");
    ctx?.fillRect(0, 0, 2, 2);
    const stream = canvas.captureStream?.(1);
    if (stream && stream.getTracks().length) video.srcObject = stream;
  } catch {
    /* captureStream is optional */
  }

  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: label,
        artist: "One Life",
        album: "Keep GPS alive",
      });
      navigator.mediaSession.playbackState = "playing";
    } catch {
      /* Media Session optional */
    }
  }

  async function requestLock() {
    if (stopped) return;
    try {
      await audio.play();
    } catch {
      /* needs a gesture; Start walk already provided one */
    }
    try {
      await video.play();
    } catch {
      /* video keep-awake is best-effort */
    }
    const wake = (navigator as WakeLockNavigator).wakeLock;
    if (!wake) return;
    try {
      sentinel = await wake.request("screen");
      sentinel.addEventListener("release", () => {
        if (!stopped && document.visibilityState === "visible") void requestLock();
      });
    } catch {
      /* Low Power Mode or older iOS can deny wake lock */
    }
  }

  function onVisible() {
    if (stopped || document.visibilityState !== "visible") return;
    void requestLock();
  }

  void requestLock();
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("pageshow", onVisible);
  window.addEventListener("focus", onVisible);

  return () => {
    stopped = true;
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("pageshow", onVisible);
    window.removeEventListener("focus", onVisible);
    void sentinel?.release();
    sentinel = null;
    audio.pause();
    video.pause();
    audio.remove();
    video.remove();
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.playbackState = "none";
      } catch {
        /* ignore */
      }
    }
  };
}

/** True when JS was frozen (screen lock) between two beats. */
export function jsWasFrozen(lastBeatMs: number, nowMs: number, thresholdMs = 4000) {
  return nowMs - lastBeatMs >= thresholdMs;
}

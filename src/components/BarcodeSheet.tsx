import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { DEMO_BARCODES } from "../lib/barcodes";
import { Sheet } from "./Sheet";

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
};

export function BarcodeSheet({ open, loading = false, onClose, onScan }: Props) {
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      setCameraOn(false);
      setCameraError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!cameraOn || !open) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (scanTimerRef.current) window.clearInterval(scanTimerRef.current);
      return;
    }

    let cancelled = false;

    async function startCamera() {
      if (!("mediaDevices" in navigator)) {
        setCameraError("Camera not available in this browser.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if (window.BarcodeDetector) {
          const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
          scanTimerRef.current = window.setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;
            try {
              const codes = await detector.detect(videoRef.current);
              const code = codes[0]?.rawValue;
              if (code) {
                setCameraOn(false);
                onScan(code);
              }
            } catch {
              /* ignore frame errors */
            }
          }, 450);
        } else {
          setCameraError("Live scan needs a newer browser. Type the barcode below.");
        }
      } catch {
        setCameraError("Camera permission denied or unavailable.");
      }
    }

    void startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (scanTimerRef.current) window.clearInterval(scanTimerRef.current);
    };
  }, [cameraOn, open, onScan]);

  return (
    <Sheet open={open} title="Scan barcode" onClose={onClose}>
      <p className="text-sm text-fog">
        Look up packaged food via Open Food Facts. Use your camera or type the digits from the label.
      </p>

      {cameraOn ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-black">
          <video ref={videoRef} className="aspect-[4/3] w-full object-cover" playsInline muted />
          <p className="px-3 py-2 text-center text-xs text-fog">Point at the barcode — hold steady</p>
        </div>
      ) : null}

      {cameraError ? <p className="mt-3 text-sm text-run">{cameraError}</p> : null}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setCameraError(null);
            setCameraOn((value) => !value);
          }}
          className="flex-1 rounded-2xl border border-line bg-card py-3 text-sm font-medium text-snow disabled:opacity-50"
        >
          {cameraOn ? "Stop camera" : "Use camera"}
        </button>
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const code = String(data.get("code") ?? "").trim();
          if (code) onScan(code);
        }}
      >
        <input
          name="code"
          placeholder="4800123456789"
          className="flex-1 rounded-2xl border border-line bg-card px-3 py-3 outline-none"
          inputMode="numeric"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-2xl bg-eat px-4 py-3 font-semibold text-ink disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          Look up
        </button>
      </form>

      <div className="mt-4 space-y-2">
        <p className="text-xs uppercase tracking-wide text-fog">Demo scans (local)</p>
        {DEMO_BARCODES.map((item) => (
          <button
            key={item.code}
            type="button"
            disabled={loading}
            onClick={() => onScan(item.code)}
            className="flex w-full items-center justify-between rounded-2xl bg-card px-3 py-3 text-left disabled:opacity-50"
          >
            <span>{item.label}</span>
            <span className="font-mono text-xs text-fog">{item.code.slice(-4)}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

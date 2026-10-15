import {
  Activity,
  CheckCircle2,
  Clock,
  Keyboard,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

interface KeystrokeData {
  key: number;
  H: number;
  UD: number;
  DD: number;
}

interface KeystrokeCaptureProps {
  onKeystrokeData: (data: KeystrokeData) => void;
}

interface CaptureState {
  lastKeyDownAt: number | null;
  lastKeyUpAt: number | null;
  pendingKeys: Map<string, number>;
  holdTimes: number[];
  upDownTimes: number[];
  downDownTimes: number[];
  lastKeyCode: number | null;
}

const sentence = "The quick brown fox jumps over the lazy dog.";
const ignoredKeys = new Set(["Shift", "Control", "Alt", "CapsLock", "Tab", "Enter"]);

const createCaptureState = (): CaptureState => ({
  lastKeyDownAt: null,
  lastKeyUpAt: null,
  pendingKeys: new Map(),
  holdTimes: [],
  upDownTimes: [],
  downDownTimes: [],
  lastKeyCode: null,
});

const average = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;

const getKeyCode = (event: KeyboardEvent<HTMLElement>) => {
  const keyCode = event.keyCode || event.which;
  return Number.isFinite(keyCode) && keyCode > 0 ? keyCode : null;
};

const isCapturableKey = (event: KeyboardEvent<HTMLElement>) =>
  event.key.length === 1 && !ignoredKeys.has(event.key);

export default function KeystrokeCapture({ onKeystrokeData }: KeystrokeCaptureProps) {
  const [mode, setMode] = useState<"standard" | "freeform">("standard");

  // Freeform state
  const [text, setText] = useState("");
  const freeformCaptureState = useRef<CaptureState>(createCaptureState());
  const [freeformStats, setFreeformStats] = useState({ count: 0, H: 0, UD: 0, DD: 0 });

  // Standardized Tapping Protocol state
  const [isTappingActive, setIsTappingActive] = useState(false);
  const [tappingTimeRemaining, setTappingTimeRemaining] = useState(15);
  const [tapCount, setTapCount] = useState(0);
  const [isTappingCompleted, setIsTappingCompleted] = useState(false);
  const [activeExpectedKey, setActiveExpectedKey] = useState<"Z" | "/">("Z");
  const [tapStats, setTapStats] = useState({ H: 0, UD: 0, DD: 0, hz: 0, cv: 0 });

  const tappingCaptureState = useRef<CaptureState>(createCaptureState());
  const tappingStartTime = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const emitData = useCallback((state: CaptureState) => {
    const data: KeystrokeData = {
      key: state.lastKeyCode ?? 70,
      H: average(state.holdTimes),
      UD: average(state.upDownTimes),
      DD: average(state.downDownTimes),
    };
    onKeystrokeData(data);
  }, [onKeystrokeData]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Freeform handlers
  const handleFreeformKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isCapturableKey(event) || event.repeat) return;
    const now = performance.now() / 1000;
    const current = freeformCaptureState.current;
    const keyId = event.code || event.key;
    const keyCode = getKeyCode(event);

    if (current.lastKeyDownAt !== null) {
      current.downDownTimes.push(now - current.lastKeyDownAt);
    }
    if (current.lastKeyUpAt !== null) {
      current.upDownTimes.push(now - current.lastKeyUpAt);
    }
    current.pendingKeys.set(keyId, now);
    current.lastKeyDownAt = now;
    current.lastKeyCode = keyCode;
  };

  const handleFreeformKeyUp = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isCapturableKey(event)) return;
    const now = performance.now() / 1000;
    const current = freeformCaptureState.current;
    const keyId = event.code || event.key;
    const keyDownAt = current.pendingKeys.get(keyId);
    if (keyDownAt === undefined) return;

    current.holdTimes.push(now - keyDownAt);
    current.pendingKeys.delete(keyId);
    current.lastKeyUpAt = now;

    const avgH = average(current.holdTimes);
    const avgUD = average(current.upDownTimes);
    const avgDD = average(current.downDownTimes);

    setFreeformStats({
      count: current.holdTimes.length,
      H: Math.round(avgH * 1000),
      UD: Math.round(avgUD * 1000),
      DD: Math.round(avgDD * 1000),
    });

    emitData(current);
  };

  const resetFreeform = () => {
    setText("");
    freeformCaptureState.current = createCaptureState();
    setFreeformStats({ count: 0, H: 0, UD: 0, DD: 0 });
  };

  // Standardized Tapping Protocol Handlers
  const startTappingTest = () => {
    tappingCaptureState.current = createCaptureState();
    tappingStartTime.current = performance.now() / 1000;
    setTapCount(0);
    setIsTappingCompleted(false);
    setIsTappingActive(true);
    setTappingTimeRemaining(15);
    setActiveExpectedKey("Z");
    setTapStats({ H: 0, UD: 0, DD: 0, hz: 0, cv: 0 });

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTappingTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsTappingActive(false);
          setIsTappingCompleted(true);
          emitData(tappingCaptureState.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetTappingTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTappingActive(false);
    setIsTappingCompleted(false);
    setTappingTimeRemaining(15);
    setTapCount(0);
    tappingCaptureState.current = createCaptureState();
    setTapStats({ H: 0, UD: 0, DD: 0, hz: 0, cv: 0 });
  };

  const handleTappingKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isTappingActive || event.repeat) return;
    const pressedKey = event.key.toUpperCase();
    if (pressedKey !== "Z" && pressedKey !== "/") return;

    event.preventDefault();
    const now = performance.now() / 1000;
    const current = tappingCaptureState.current;
    const keyId = event.code || event.key;
    const keyCode = getKeyCode(event);

    if (current.lastKeyDownAt !== null) {
      current.downDownTimes.push(now - current.lastKeyDownAt);
    }
    if (current.lastKeyUpAt !== null) {
      current.upDownTimes.push(now - current.lastKeyUpAt);
    }
    current.pendingKeys.set(keyId, now);
    current.lastKeyDownAt = now;
    current.lastKeyCode = keyCode;

    setActiveExpectedKey((prev) => (prev === "Z" ? "/" : "Z"));
  };

  const handleTappingKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isTappingActive) return;
    const pressedKey = event.key.toUpperCase();
    if (pressedKey !== "Z" && pressedKey !== "/") return;

    event.preventDefault();
    const now = performance.now() / 1000;
    const current = tappingCaptureState.current;
    const keyId = event.code || event.key;
    const keyDownAt = current.pendingKeys.get(keyId);
    if (keyDownAt === undefined) return;

    current.holdTimes.push(now - keyDownAt);
    current.pendingKeys.delete(keyId);
    current.lastKeyUpAt = now;

    const count = current.holdTimes.length;
    setTapCount(count);

    const elapsed = tappingStartTime.current ? Math.max(0.1, now - tappingStartTime.current) : 1;
    const hz = Number((count / elapsed).toFixed(1));
    const avgH = average(current.holdTimes);
    const avgUD = average(current.upDownTimes);
    const avgDD = average(current.downDownTimes);

    // Rhythm variability (coefficient of variation of DD)
    let cv = 0;
    if (current.downDownTimes.length > 2 && avgDD > 0) {
      const variance =
        current.downDownTimes.reduce((sum, val) => sum + Math.pow(val - avgDD, 2), 0) /
        current.downDownTimes.length;
      cv = Math.round((Math.sqrt(variance) / avgDD) * 100);
    }

    setTapStats({
      H: Math.round(avgH * 1000),
      UD: Math.round(avgUD * 1000),
      DD: Math.round(avgDD * 1000),
      hz,
      cv,
    });

    emitData(current);
  };

  return (
    <div className="space-y-4">
      {/* Protocol Mode Switcher */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex rounded-xl bg-white/[0.04] p-1 border border-line">
          <button
            type="button"
            onClick={() => setMode("standard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === "standard"
                ? "bg-primary text-app font-bold shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            <Activity className="size-3.5" />
            Standardized Neuromotor Tapping (15s)
          </button>
          <button
            type="button"
            onClick={() => setMode("freeform")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === "freeform"
                ? "bg-primary text-app font-bold shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            <Keyboard className="size-3.5" />
            Freeform Typing Passage
          </button>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted font-mono">
          <Zap className="size-3 text-warning" />
          High-Precision Motor Timers
        </span>
      </div>

      {mode === "standard" ? (
        /* STANDARDIZED 15-SECOND BILATERAL MOTOR TAPPING TEST */
        <div
          tabIndex={0}
          onKeyDown={handleTappingKeyDown}
          onKeyUp={handleTappingKeyUp}
          className="rounded-2xl border border-line bg-surface/50 p-5 space-y-5 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                  Clinical Protocol
                </span>
                <span className="text-xs font-semibold text-text">
                  Bilateral Alternating Rhythm Test
                </span>
              </div>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Alternately tap the <strong className="text-text">‘Z’</strong> and <strong className="text-text">‘/’</strong> keys as rapidly and steadily as possible for 15 seconds.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isTappingActive && !isTappingCompleted && (
                <button
                  type="button"
                  onClick={startTappingTest}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-app font-bold text-xs shadow-md hover:opacity-90 active:scale-95 transition-all"
                >
                  <Play className="size-3.5 fill-current" />
                  Start 15s Test
                </button>
              )}
              {isTappingActive && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-danger/30 bg-danger/10 text-danger text-xs font-mono font-bold animate-pulse">
                  <Clock className="size-4" />
                  <span>{tappingTimeRemaining}s remaining</span>
                </div>
              )}
              {(isTappingActive || isTappingCompleted) && (
                <button
                  type="button"
                  onClick={resetTappingTest}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-line text-muted hover:text-text text-xs transition-all"
                >
                  <RotateCcw className="size-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Interactive Keyboard Target Display */}
          <div className="grid grid-cols-2 gap-4 py-2">
            <div
              className={`p-6 rounded-2xl border text-center transition-all ${
                activeExpectedKey === "Z" && isTappingActive
                  ? "border-primary bg-primary/20 scale-[1.02] shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_30%,transparent)]"
                  : "border-line bg-white/[0.02]"
              }`}
            >
              <span className="text-muted text-[10px] uppercase tracking-wider block font-semibold">Left Hand</span>
              <kbd className="mt-2 inline-block px-5 py-3 rounded-xl border border-line-strong bg-surface-strong font-mono text-3xl font-bold text-text shadow-inner">
                Z
              </kbd>
            </div>

            <div
              className={`p-6 rounded-2xl border text-center transition-all ${
                activeExpectedKey === "/" && isTappingActive
                  ? "border-primary bg-primary/20 scale-[1.02] shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_30%,transparent)]"
                  : "border-line bg-white/[0.02]"
              }`}
            >
              <span className="text-muted text-[10px] uppercase tracking-wider block font-semibold">Right Hand</span>
              <kbd className="mt-2 inline-block px-5 py-3 rounded-xl border border-line-strong bg-surface-strong font-mono text-3xl font-bold text-text shadow-inner">
                /
              </kbd>
            </div>
          </div>

          {/* Real-Time Motor Kinematics HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl border border-line bg-white/[0.02]">
              <span className="text-muted block text-[10px]">Taps Completed</span>
              <span className="font-bold text-base text-text">{tapCount}</span>
            </div>
            <div className="p-3 rounded-xl border border-line bg-white/[0.02]">
              <span className="text-muted block text-[10px]">Tap Rate (Hz)</span>
              <span className="font-bold text-base text-primary">{tapStats.hz} <span className="text-[10px] text-muted">tap/s</span></span>
            </div>
            <div className="p-3 rounded-xl border border-line bg-white/[0.02]">
              <span className="text-muted block text-[10px]">Hold Time H</span>
              <span className="font-bold text-base text-text">{tapStats.H} <span className="text-[10px] text-muted">ms</span></span>
            </div>
            <div className="p-3 rounded-xl border border-line bg-white/[0.02]">
              <span className="text-muted block text-[10px]">Latency UD</span>
              <span className="font-bold text-base text-text">{tapStats.UD} <span className="text-[10px] text-muted">ms</span></span>
            </div>
            <div className="p-3 rounded-xl border border-line bg-white/[0.02] col-span-2 sm:col-span-1">
              <span className="text-muted block text-[10px]">Rhythm Var (CV)</span>
              <span className="font-bold text-base text-success">{tapStats.cv}%</span>
            </div>
          </div>

          {isTappingCompleted && (
            <div className="flex items-center justify-between p-3 rounded-xl border border-success/30 bg-success/10 text-success text-xs font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Protocol Complete: Neuromotor timing profile calibrated and ready for prediction model.</span>
              </div>
              <span className="font-mono text-[11px] font-bold">100% Calibrated</span>
            </div>
          )}

          {!isTappingActive && !isTappingCompleted && (
            <p className="text-[11px] text-muted italic text-center">
              Click &quot;Start 15s Test&quot; above and begin alternating between the Z and / keys on your keyboard.
            </p>
          )}
        </div>
      ) : (
        /* FREEFORM TEXT PASSAGE MODE */
        <div className="rounded-2xl border border-line bg-surface/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-text">Natural Typing Passage</h4>
              <p className="text-xs text-muted">Type the sample sentence below naturally at your usual pace.</p>
            </div>
            {freeformStats.count > 0 && (
              <button
                type="button"
                onClick={resetFreeform}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-line text-xs text-muted hover:text-text"
              >
                <RotateCcw className="size-3" />
                Clear
              </button>
            )}
          </div>

          <div className="rounded-xl border border-line/60 bg-black/20 p-3.5 text-xs font-mono text-muted/90 select-none">
            {sentence}
          </div>

          <textarea
            className="w-full rounded-xl border border-line bg-white/[0.03] p-3 text-xs text-text placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-24 leading-relaxed"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleFreeformKeyDown}
            onKeyUp={handleFreeformKeyUp}
            placeholder="Click here and begin typing the passage above..."
            aria-label="Typing assessment input"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-lg border border-line bg-white/[0.02]">
              <span className="text-muted block text-[10px]">Keys Captured</span>
              <span className="font-bold text-text">{freeformStats.count}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-line bg-white/[0.02]">
              <span className="text-muted block text-[10px]">Hold Time H</span>
              <span className="font-bold text-primary">{freeformStats.H} ms</span>
            </div>
            <div className="p-2.5 rounded-lg border border-line bg-white/[0.02]">
              <span className="text-muted block text-[10px]">Latency UD</span>
              <span className="font-bold text-text">{freeformStats.UD} ms</span>
            </div>
            <div className="p-2.5 rounded-lg border border-line bg-white/[0.02]">
              <span className="text-muted block text-[10px]">Latency DD</span>
              <span className="font-bold text-text">{freeformStats.DD} ms</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[11px] text-muted italic">
        <Sparkles className="size-3.5 text-primary shrink-0" />
        <span>Timing values are automatically formatted and injected into the prediction payload.</span>
      </div>
    </div>
  );
}

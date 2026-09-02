import { useRef, useState, type KeyboardEvent } from "react";

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

const average = (values: number[]) => values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;

const getKeyCode = (event: KeyboardEvent<HTMLTextAreaElement>) => {
  const keyCode = event.keyCode || event.which;
  return Number.isFinite(keyCode) && keyCode > 0 ? keyCode : null;
};

const isCapturableKey = (event: KeyboardEvent<HTMLTextAreaElement>) => event.key.length === 1 && !ignoredKeys.has(event.key);

export default function KeystrokeCapture({ onKeystrokeData }: KeystrokeCaptureProps) {
  const [text, setText] = useState("");
  const captureState = useRef<CaptureState>(createCaptureState());

 const emitKeystrokeData = () => {
  const current = captureState.current;

  const data = {
    key: current.lastKeyCode ?? 0,
    H: average(current.holdTimes),
    UD: average(current.upDownTimes),
    DD: average(current.downDownTimes),
  };

  console.log("Keystroke Data:", data);

  onKeystrokeData(data);
};

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isCapturableKey(event) || event.repeat) return;

    const now = performance.now() / 1000;
    const current = captureState.current;
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

  const handleKeyUp = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isCapturableKey(event)) return;

    const now = performance.now() / 1000;
    const current = captureState.current;
    const keyId = event.code || event.key;
    const keyDownAt = current.pendingKeys.get(keyId);

    if (keyDownAt === undefined) return;

    current.holdTimes.push(now - keyDownAt);
    current.pendingKeys.delete(keyId);
    current.lastKeyUpAt = now;
    emitKeystrokeData();
  };

  return (
    <div className="mt-6 rounded-xl border border-line p-5">
      <h3 className="text-lg font-semibold">Typing Behaviour Assessment</h3>
      <p className="mt-2 text-sm text-muted">Type the sentence below naturally.</p>
      <div className="mt-4 rounded-lg bg-black/20 p-3">{sentence}</div>
      <textarea
        className="mt-4 w-full rounded-lg border p-3"
        rows={4}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        placeholder="Start typing here..."
        aria-label="Typing assessment input"
      />
    </div>
  );
}

import { useState } from "react";

export default function KeystrokeTest() {
  const sentence = "The quick brown fox jumps over the lazy dog.";

  return (
    <div className="glass-panel p-6 mt-6">
      <h2 className="text-xl font-bold">Typing Behaviour Assessment</h2>

      <p className="mt-2 text-muted">
        Type the sentence below naturally.
      </p>

      <div className="mt-4 rounded-lg border p-4">
        {sentence}
      </div>

      <textarea
        className="mt-4 w-full rounded-lg border p-4"
        rows={4}
        placeholder="Start typing here..."
      />

    </div>
  );
}
// src/components/LipSyncModule.jsx
import React, { useState } from "react";
import StepIndicator from "./StepIndicator";
import AvatarPanel from "./AvatarPanel";
import ScriptPanel from "./ScriptPanel";
import { useLipSync } from "../hooks/useLipSync";

export default function LipSyncModule({ onBack, onNext }) {
  const [script, setScript] = useState(
    "Hi everyone! I am your AI Twin. Today I am going to show you this amazing product and answer your questions live."
  );
  const [avatarFile, setAvatarFile] = useState(null);

  const { status, progress, videoUrl, avatarUrl, error, generate, reset } = useLipSync();

  const handleGenerate = () => {
    generate({ file: avatarFile, script });
  };

  const handleReset = () => {
    reset();
    setAvatarFile(null);
  };

  return (
    <div className="page-wrapper">
      <StepIndicator currentStep={4} />

      <div className="module-card">
        <div className="module-header">
          <h2 className="module-title">Lip Sync Setup</h2>
          <p className="module-subtitle">
            Test how your AI Twin mouth movement matches the selected voice.
          </p>
          {(status === "done" || status === "error") && (
            <button className="btn-reset" onClick={handleReset}>
              ↺ Reset
            </button>
          )}
        </div>

        <div className="panels-grid">
          <AvatarPanel
            avatarUrl={avatarUrl}
            status={status}
            onFileChange={setAvatarFile}
          />
          <ScriptPanel
            script={script}
            setScript={setScript}
            onGenerate={handleGenerate}
            status={status}
            progress={progress}
            videoUrl={videoUrl}
            error={error}
          />
        </div>
      </div>

      <div className="nav-bar">
        <button className="btn-back" onClick={onBack}>
          ← Back
        </button>
        <button
          className="btn-next"
          onClick={onNext}
          disabled={status !== "done" && status !== "idle"}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

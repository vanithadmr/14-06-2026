// src/components/ScriptPanel.jsx
import React from "react";

const DEFAULT_SCRIPT =
  "Hi everyone! I am your AI Twin. Today I am going to show you this amazing product and answer your questions live.";

export default function ScriptPanel({
  script,
  setScript,
  onGenerate,
  status,
  progress,
  videoUrl,
  error,
}) {
  const isLoading = status === "uploading" || status === "processing";

  return (
    <div className="script-panel">
      <h3 className="script-title">Test Script</h3>

      <textarea
        className="script-textarea"
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder={DEFAULT_SCRIPT}
        rows={6}
        disabled={isLoading}
        maxLength={500}
      />
      <div className="char-count">{script.length} / 500</div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {isLoading && (
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <span className="progress-label">{progress}%</span>
        </div>
      )}

      <button
        className={`btn-generate ${isLoading ? "btn-loading" : ""}`}
        onClick={onGenerate}
        disabled={isLoading || script.trim().length === 0}
      >
        {isLoading ? (
          <>
            <span className="btn-spinner" /> Generating…
          </>
        ) : (
          "Generate Lip Sync Preview"
        )}
      </button>

      {videoUrl && status === "done" && (
        <div className="video-preview">
          <h4>Preview</h4>
          <video src={videoUrl} controls autoPlay loop className="preview-video" />
          <a href={videoUrl} download className="btn-download">
            ⬇ Download Preview
          </a>
        </div>
      )}
    </div>
  );
}

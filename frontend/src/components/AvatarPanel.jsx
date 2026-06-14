// src/components/AvatarPanel.jsx
import React, { useRef, useState } from "react";

export default function AvatarPanel({ avatarUrl, status, onFileChange }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onFileChange(file);
  };

  const displaySrc = preview || avatarUrl || null;
  const isProcessing = status === "uploading" || status === "processing";

  return (
    <div className="avatar-panel">
      <div className="avatar-frame" onClick={() => !isProcessing && inputRef.current.click()}>
        {displaySrc ? (
          <img src={displaySrc} alt="AI Twin Avatar" className="avatar-img" />
        ) : (
          <div className="avatar-placeholder">
            <span className="avatar-placeholder-icon">🖼️</span>
            <p>Click to upload avatar image</p>
            <small>JPG, PNG, WEBP — max 50 MB</small>
          </div>
        )}
        {isProcessing && (
          <div className="avatar-overlay">
            <div className="spinner" />
            <span>Processing…</span>
          </div>
        )}
        {!isProcessing && displaySrc && (
          <div className="avatar-change-hint">Click to change</div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4"
        style={{ display: "none" }}
        onChange={handleFile}
      />

      <div className="lip-sync-status-badge">
        <span className="badge-icon">
          {status === "done" ? "✅" : status === "error" ? "❌" : "💬"}
        </span>
        <div>
          <strong>Lip Sync Status</strong>
          <p>
            {status === "idle" && "Upload an avatar and generate a preview."}
            {status === "uploading" && "Uploading avatar…"}
            {status === "processing" && "Syncing voice and face movement…"}
            {status === "done" && "Voice and face movement synced successfully!"}
            {status === "error" && "Sync failed. Please try again."}
          </p>
        </div>
      </div>
    </div>
  );
}

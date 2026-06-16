// src/hooks/useLipSync.js
import { useState, useCallback, useRef } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export function useLipSync() {
  const [status, setStatus] = useState("idle"); // idle | uploading | processing | done | error
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const pollStatus = useCallback((id) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/lipsync/status/${id}`);
        const data = await res.json();

        if (data.status === "done") {
          stopPolling();
          setVideoUrl(data.videoUrl);
          setStatus("done");
          setProgress(100);
        } else if (data.status === "error") {
          stopPolling();
          setError(data.message || "Processing failed.");
          setStatus("error");
        } else {
          setProgress(data.progress || 0);
        }
      } catch (e) {
        stopPolling();
        setError("Could not reach the server.");
        setStatus("error");
      }
    }, 2000);
  }, []);

  const generate = useCallback(
    async ({ file, script, voiceId, gender }) => {
      setError(null);
      setVideoUrl(null);
      setProgress(0);
      setStatus("uploading");

      try {
        const formData = new FormData();
        if (file) formData.append("avatar", file);
        formData.append("gender", gender || "female");
        formData.append("script", script);
        formData.append("gender", gender || "female");
        if (voiceId) formData.append("voiceId", voiceId);

        const res = await fetch(`${API_BASE}/api/lipsync/generate`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Request failed");

        setJobId(data.jobId);
        setAvatarUrl(data.avatarUrl);
        setStatus("processing");
        pollStatus(data.jobId);
      } catch (e) {
        setError(e.message);
        setStatus("error");
      }
    },
    [pollStatus]
  );

  const reset = useCallback(() => {
    stopPolling();
    setStatus("idle");
    setProgress(0);
    setVideoUrl(null);
    setAvatarUrl(null);
    setJobId(null);
    setError(null);
  }, []);

  return { status, progress, videoUrl, avatarUrl, jobId, error, generate, reset };
}

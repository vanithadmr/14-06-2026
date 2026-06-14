// src/components/StepIndicator.jsx
import React from "react";

const STEPS = [
  { id: 1, label: "Basic Info", icon: "👤" },
  { id: 2, label: "Appearance", icon: "✨" },
  { id: 3, label: "Voice", icon: "🎙️" },
  { id: 4, label: "Lip Sync", icon: "💬" },
  { id: 5, label: "Train AI", icon: "🧠" },
  { id: 6, label: "Preview", icon: "▶️" },
];

export default function StepIndicator({ currentStep = 4 }) {
  return (
    <div className="step-grid">
      {STEPS.map((step) => {
        const isActive = step.id === currentStep;
        const isDone = step.id < currentStep;
        return (
          <div
            key={step.id}
            className={`step-card ${isActive ? "step-active" : ""} ${isDone ? "step-done" : ""}`}
          >
            <span className="step-icon">
              {isDone ? "✅" : step.icon}
            </span>
            <div className="step-text">
              <span className="step-label">Step {step.id}</span>
              <strong className="step-name">{step.label}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}

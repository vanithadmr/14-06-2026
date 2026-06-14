// src/App.jsx
import React from "react";
import LipSyncModule from "./components/LipSyncModule";
import "./App.css";

export default function App() {
  return (
    <LipSyncModule
      onBack={() => console.log("Navigate to Step 3: Voice")}
      onNext={() => console.log("Navigate to Step 5: Train AI")}
    />
  );
}

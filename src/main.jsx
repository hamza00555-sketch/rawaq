import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ensureHomes } from "./homes.js";
import "./styles.css";

// Full data reset requested from Settings: wipe happens here, before React
// mounts, so no auto-save effect can race the wipe and re-persist old state.
if (sessionStorage.getItem("rawaq_reset") === "1") {
  sessionStorage.removeItem("rawaq_reset");
  Object.keys(localStorage)
    .filter((key) => key.startsWith("rawaq_"))
    .forEach((key) => localStorage.removeItem(key));
}

// Migrate a legacy single-home install into the multi-home layout (and
// seed the registry for fresh installs) before anything reads storage.
ensureHomes();

createRoot(document.getElementById("root")).render(<App />);

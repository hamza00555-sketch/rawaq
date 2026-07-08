import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

// Full data reset requested from Settings: wipe happens here, before React
// mounts, so no auto-save effect can race the wipe and re-persist old state.
if (sessionStorage.getItem("rawaq_reset") === "1") {
  sessionStorage.removeItem("rawaq_reset");
  Object.keys(localStorage)
    .filter((key) => key.startsWith("rawaq_"))
    .forEach((key) => localStorage.removeItem(key));
}

createRoot(document.getElementById("root")).render(<App />);

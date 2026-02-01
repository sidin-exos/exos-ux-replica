import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Polyfill for libraries that expect Node's global Buffer (e.g. @react-pdf/renderer in the browser)
import { Buffer } from "buffer";
if (!(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

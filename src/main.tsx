import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { SystemProvider } from "./context/SystemContext";

import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SystemProvider>
      <App />
    </SystemProvider>
  </StrictMode>
);

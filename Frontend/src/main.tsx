import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";

// Light is now the default theme. Only apply `.dark` for users who opted into dark.
const savedTheme = localStorage.getItem("prestrokenet-theme");
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
} else if (savedTheme === "light") {
  // Migrate old "light" preference — light is now default, no class needed
  localStorage.removeItem("prestrokenet-theme");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

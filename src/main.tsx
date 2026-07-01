 import { StrictMode } from "react";
 import { createRoot } from "react-dom/client";
 import App from "./App.tsx";
 import { installDemoData } from "./seedData";
 import "./index.css";
 
 // One-time, version-gated seed of the 25-year demo workspace into localStorage
 // so the app opens straight into a rich, mature-looking dashboard.
 installDemoData();
 
 createRoot(document.getElementById("root")!).render(
  <StrictMode>
  <App />
  </StrictMode>
 );
 

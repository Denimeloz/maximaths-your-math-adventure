import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/push";
import { listenForInstallPrompt } from "./lib/install";
import { initNatif } from "./lib/natif";

initNatif();
listenForInstallPrompt();
createRoot(document.getElementById("root")!).render(<App />);

registerServiceWorker();

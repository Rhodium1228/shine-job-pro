import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { TenantProvider } from "./contexts/TenantContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <TenantProvider>
    <App />
  </TenantProvider>
);

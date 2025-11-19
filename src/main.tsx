import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { SessionProvider } from "./contexts/SessionContext.tsx";
import { ThemeProvider } from "./components/ThemeProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <SessionProvider>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </SessionProvider>
);
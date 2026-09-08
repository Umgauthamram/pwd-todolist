"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

export default function PwaRegistrar() {
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] ServiceWorker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.error("[PWA] ServiceWorker registration failed:", error);
          });
      });
    }

    // 2. Track Online / Offline connectivity
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    // 3. Capture PWA Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.deferredPrompt = e as BeforeInstallPromptEvent;
      window.dispatchEvent(new Event("pwa-installable"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 px-3.5 py-2 rounded-xl bg-amber-500/90 text-slate-900 font-medium text-xs shadow-2xl flex items-center gap-2 backdrop-blur-md animate-bounce">
      <span>⚡</span>
      <span>You are offline. Beginning is operating from local cache.</span>
    </div>
  );
}

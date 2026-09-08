"use client";

import React, { useEffect, useState } from "react";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";
import CloseIcon from "@mui/icons-material/Close";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";

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
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const [instructionsOpen, setInstructionsOpen] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] ServiceWorker registered:", registration.scope);
          })
          .catch((error) => {
            console.error("[PWA] ServiceWorker registration failed:", error);
          });
      });
    }

    // 2. Check standalone mode (already installed as PWA)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(Boolean(isStandaloneMode));
    };
    checkStandalone();

    // 3. Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    // 4. Online / Offline connectivity
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 5. Capture PWA Install Prompt (Chrome / Edge / Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.deferredPrompt = e as BeforeInstallPromptEvent;
      setCanInstall(true);
      window.dispatchEvent(new Event("pwa-installable"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 6. Listen for installed event
    const handleAppInstalled = () => {
      window.deferredPrompt = null;
      setCanInstall(false);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    // 7. Listen for global install trigger from buttons across the app
    const handleTriggerInstall = () => {
      triggerInstallFlow();
    };
    window.addEventListener("trigger-pwa-install", handleTriggerInstall);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("trigger-pwa-install", handleTriggerInstall);
    };
  }, []);

  const triggerInstallFlow = async () => {
    if (window.deferredPrompt) {
      try {
        await window.deferredPrompt.prompt();
        const choice = await window.deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          window.deferredPrompt = null;
          setCanInstall(false);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
        setInstructionsOpen(true);
      }
    } else {
      // If iOS or deferredPrompt not available, show instructional modal
      setInstructionsOpen(true);
    }
  };

  // Don't show install banner if app is already running in installed standalone mode
  const showBanner = !isStandalone && !bannerDismissed;

  return (
    <>
      {/* Offline Alert */}
      {isOffline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-neutral-900 border border-neutral-700 text-white font-medium text-xs shadow-2xl flex items-center gap-2 backdrop-blur-md animate-pulse">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>Offline mode active. Your notes are cached locally.</span>
        </div>
      )}

      {/* Installed Success Toast */}
      {installedSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-white text-black font-semibold text-xs shadow-2xl flex items-center gap-2">
          <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
          <span>Beginning installed successfully!</span>
        </div>
      )}

      {/* Floating Download / Install Bar (Mobile & Desktop) */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 p-3.5 rounded-2xl bg-[#0e0e10] border border-[#262626] shadow-2xl flex items-center justify-between gap-3 text-white backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            {/* App Icon */}
            <div className="w-10 h-10 rounded-xl bg-white border border-neutral-300 flex items-center justify-center shrink-0 overflow-hidden p-0.5">
              <img src="/icon-192.png" alt="Beginning" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">Install Beginning App</p>
              <p className="text-[11px] text-neutral-400 truncate">Add to home screen for offline access</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={triggerInstallFlow}
              className="px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors flex items-center gap-1.5 shadow"
            >
              <InstallMobileIcon sx={{ fontSize: 16 }} />
              <span>Download</span>
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Dismiss"
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      )}

      {/* Instructions Dialog for iOS and other browsers */}
      <Dialog
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: "#0a0a0c",
            border: "1px solid #262626",
            borderRadius: "20px",
            color: "#ffffff",
            maxWidth: "420px",
            width: "90%",
            m: 2,
          },
        }}
      >
        <DialogContent sx={{ p: 3 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-neutral-300 flex items-center justify-center overflow-hidden p-0.5">
                <img src="/icon-192.png" alt="Beginning" className="w-full h-full object-contain rounded-lg" />
              </div>
              <h3 className="text-sm font-semibold text-white">Install Beginning</h3>
            </div>
            <button
              onClick={() => setInstructionsOpen(false)}
              className="text-neutral-400 hover:text-white p-1"
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </button>
          </div>

          {isIos ? (
            <div className="space-y-3.5 text-xs text-neutral-300">
              <p className="text-neutral-400">
                To install this app on your iPhone or iPad using Safari:
              </p>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-black border border-[#222]">
                <IosShareIcon className="text-white mt-0.5" sx={{ fontSize: 18 }} />
                <div>
                  <span className="font-semibold text-white">Step 1:</span> Tap the{" "}
                  <strong className="text-white">Share</strong> button at the bottom of Safari.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-black border border-[#222]">
                <AddBoxOutlinedIcon className="text-white mt-0.5" sx={{ fontSize: 18 }} />
                <div>
                  <span className="font-semibold text-white">Step 2:</span> Scroll down and tap{" "}
                  <strong className="text-white">&ldquo;Add to Home Screen&rdquo;</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-black border border-[#222]">
                <CheckCircleOutlineIcon className="text-white mt-0.5" sx={{ fontSize: 18 }} />
                <div>
                  <span className="font-semibold text-white">Step 3:</span> Tap{" "}
                  <strong className="text-white">&ldquo;Add&rdquo;</strong> at the top-right corner.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs text-neutral-300">
              <p className="text-neutral-400">
                To download and install the app on your device:
              </p>
              <div className="p-3 rounded-xl bg-black border border-[#222] space-y-2">
                <p>
                  <strong>📱 On Android Chrome:</strong> Tap the browser menu (<strong className="text-white">⋮</strong>) at top-right and choose <strong className="text-white">&ldquo;Install app&rdquo;</strong> or <strong className="text-white">&ldquo;Add to Home screen&rdquo;</strong>.
                </p>
                <p className="pt-2 border-t border-[#222]">
                  <strong>💻 On Desktop Chrome / Edge:</strong> Click the <strong className="text-white">Install</strong> icon in the address bar (next to the star/bookmark icon).
                </p>
              </div>
            </div>
          )}

          <div className="mt-5">
            <button
              onClick={() => setInstructionsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors"
            >
              Got it
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

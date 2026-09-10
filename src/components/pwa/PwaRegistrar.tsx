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

type PlatformOS = "android" | "ios" | "windows" | "mac";

export default function PwaRegistrar() {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [detectedOs, setDetectedOs] = useState<PlatformOS>("android");
  const [selectedOsTab, setSelectedOsTab] = useState<PlatformOS>("android");
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const [instructionsOpen, setInstructionsOpen] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
    // 1. Register Service Worker with Automatic Update Handling
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      let refreshing = false;

      // When the new Service Worker takes control, reload page seamlessly
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      const registerSw = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] ServiceWorker registered:", registration.scope);

            // Check if there is already a waiting worker
            if (registration.waiting) {
              setUpdateAvailable(true);
              registration.waiting.postMessage({ type: "SKIP_WAITING" });
            }

            // Listen for new service worker installation
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    // New version available! Prompt immediate activation
                    setUpdateAvailable(true);
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                  }
                });
              }
            });

            // Check for updates on startup
            registration.update();

            // Periodic background check every 15 minutes
            const updateInterval = setInterval(() => {
              registration.update();
            }, 15 * 60 * 1000);

            // Check for updates when user returns to the app / window focuses
            const onVisibilityChange = () => {
              if (document.visibilityState === "visible") {
                registration.update();
              }
            };
            document.addEventListener("visibilitychange", onVisibilityChange);
            window.addEventListener("focus", () => registration.update());

            return () => {
              clearInterval(updateInterval);
              document.removeEventListener("visibilitychange", onVisibilityChange);
            };
          })
          .catch((error) => {
            console.error("[PWA] ServiceWorker registration failed:", error);
          });
      };

      if (document.readyState === "complete") {
        registerSw();
      } else {
        window.addEventListener("load", registerSw);
      }
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

    // 3. Detect User's Operating System (Android, iOS, Windows, Mac)
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      let os: PlatformOS = "windows";
      if (/iphone|ipad|ipod/.test(ua)) {
        os = "ios";
      } else if (/android/.test(ua)) {
        os = "android";
      } else if (/macintosh|mac os x/.test(ua)) {
        os = "mac";
      } else if (/windows|win32/.test(ua)) {
        os = "windows";
      }
      setDetectedOs(os);
      setSelectedOsTab(os);
    }

    // 4. Online / Offline connectivity
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 5. Capture PWA Install Prompt (Chrome / Edge / Android / Windows / Mac)
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

    // 7. Listen for global install trigger
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
        setSelectedOsTab(detectedOs);
        setInstructionsOpen(true);
      }
    } else {
      setSelectedOsTab(detectedOs);
      setInstructionsOpen(true);
    }
  };

  // Don't show install banner if app is already running in installed standalone mode
  const showBanner = !isStandalone && !bannerDismissed;

  return (
    <>
      {/* Update Available Notification Banner */}
      {updateAvailable && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-white text-black font-semibold text-xs shadow-2xl flex items-center gap-3 border border-neutral-200 backdrop-blur-md animate-bounce">
          <span>✨ App updated to latest version!</span>
          <button
            onClick={() => window.location.reload()}
            className="px-2.5 py-1 rounded-lg bg-black text-white text-[11px] font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Refresh Now
          </button>
        </div>
      )}

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
            <div className="w-10 h-10 rounded-xl bg-white border border-neutral-300 flex items-center justify-center shrink-0 overflow-hidden p-0.5 shadow">
              <img src="/icon-192.png" alt="Beginning" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">Install Beginning App</p>
              <p className="text-[11px] text-neutral-400 truncate">
                {detectedOs === "android"
                  ? "Download for Android"
                  : detectedOs === "ios"
                  ? "Add to iPhone Home Screen"
                  : detectedOs === "mac"
                  ? "Download for Mac"
                  : "Download for Windows"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={triggerInstallFlow}
              className="px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors flex items-center gap-1.5 shadow cursor-pointer"
            >
              <InstallMobileIcon sx={{ fontSize: 16 }} />
              <span>Download</span>
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      )}

      {/* Cross-Platform Instructions Dialog (Android, iOS, Windows, Mac) */}
      <Dialog
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: "#0a0a0c",
            border: "1px solid #262626",
            borderRadius: "20px",
            color: "#ffffff",
            maxWidth: "460px",
            width: "92%",
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
              <div>
                <h3 className="text-sm font-semibold text-white">Install Beginning</h3>
                <p className="text-[11px] text-neutral-400">Available on Android, iOS, Windows &amp; Mac</p>
              </div>
            </div>
            <button
              onClick={() => setInstructionsOpen(false)}
              className="text-neutral-400 hover:text-white p-1 cursor-pointer"
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </button>
          </div>

          {/* OS Switcher Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-black border border-[#262626] rounded-xl text-[11px] font-semibold mb-4 select-none">
            <button
              type="button"
              onClick={() => setSelectedOsTab("android")}
              className={`py-1.5 rounded-lg transition-all text-center ${
                selectedOsTab === "android" ? "bg-white text-black font-bold shadow" : "text-neutral-400 hover:text-white"
              }`}
            >
              Android
            </button>
            <button
              type="button"
              onClick={() => setSelectedOsTab("ios")}
              className={`py-1.5 rounded-lg transition-all text-center ${
                selectedOsTab === "ios" ? "bg-white text-black font-bold shadow" : "text-neutral-400 hover:text-white"
              }`}
            >
              iOS
            </button>
            <button
              type="button"
              onClick={() => setSelectedOsTab("windows")}
              className={`py-1.5 rounded-lg transition-all text-center ${
                selectedOsTab === "windows" ? "bg-white text-black font-bold shadow" : "text-neutral-400 hover:text-white"
              }`}
            >
              Windows
            </button>
            <button
              type="button"
              onClick={() => setSelectedOsTab("mac")}
              className={`py-1.5 rounded-lg transition-all text-center ${
                selectedOsTab === "mac" ? "bg-white text-black font-bold shadow" : "text-neutral-400 hover:text-white"
              }`}
            >
              Mac
            </button>
          </div>

          {/* Tab 1: Android Instructions */}
          {selectedOsTab === "android" && (
            <div className="space-y-3 text-xs text-neutral-300">
              <p className="text-neutral-400">To download and install on Android (Chrome, Brave, Samsung Internet):</p>
              <div className="p-3 rounded-xl bg-black border border-[#222] space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Tap the browser menu (<strong className="text-white font-mono">⋮</strong>) at the top right.</span>
                </div>
                <div className="flex items-start gap-2.5 pt-1.5 border-t border-[#1f1f22]">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Select <strong className="text-white">&ldquo;Install app&rdquo;</strong> or <strong className="text-white">&ldquo;Add to Home screen&rdquo;</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5 pt-1.5 border-t border-[#1f1f22]">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Tap <strong className="text-white">&ldquo;Install&rdquo;</strong>. The app icon will appear in your home screen and app drawer.</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: iOS Instructions */}
          {selectedOsTab === "ios" && (
            <div className="space-y-3 text-xs text-neutral-300">
              <p className="text-neutral-400">To install on iPhone or iPad (Safari / Chrome on iOS):</p>
              <div className="p-3 rounded-xl bg-black border border-[#222] space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <IosShareIcon className="text-white shrink-0 mt-0.5" sx={{ fontSize: 18 }} />
                  <div>
                    <span className="font-semibold text-white">Step 1:</span> Tap the{" "}
                    <strong className="text-white">Share</strong> button at the bottom of Safari.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 pt-1.5 border-t border-[#1f1f22]">
                  <AddBoxOutlinedIcon className="text-white shrink-0 mt-0.5" sx={{ fontSize: 18 }} />
                  <div>
                    <span className="font-semibold text-white">Step 2:</span> Scroll down and tap{" "}
                    <strong className="text-white">&ldquo;Add to Home Screen&rdquo;</strong>.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 pt-1.5 border-t border-[#1f1f22]">
                  <CheckCircleOutlineIcon className="text-white shrink-0 mt-0.5" sx={{ fontSize: 18 }} />
                  <div>
                    <span className="font-semibold text-white">Step 3:</span> Tap{" "}
                    <strong className="text-white">&ldquo;Add&rdquo;</strong> at the top right.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Windows Instructions */}
          {selectedOsTab === "windows" && (
            <div className="space-y-3 text-xs text-neutral-300">
              <p className="text-neutral-400">To install as a native Windows application (Edge or Chrome):</p>
              <div className="p-3 rounded-xl bg-black border border-[#222] space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Look at the right side of the browser address bar for the <strong className="text-white">Install</strong> icon (🖥️ or ➕).</span>
                </div>
                <div className="flex items-start gap-2.5 pt-1.5 border-t border-[#1f1f22]">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Or click the browser menu (<strong className="text-white font-mono">⋯</strong>) $\rightarrow$ <strong className="text-white">&ldquo;Apps&rdquo;</strong> $\rightarrow$ <strong className="text-white">&ldquo;Install Beginning&rdquo;</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5 pt-1.5 border-t border-[#1f1f22]">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Click <strong className="text-white">&ldquo;Install&rdquo;</strong>. Beginning will launch in its own standalone Windows desktop window.</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Mac Instructions */}
          {selectedOsTab === "mac" && (
            <div className="space-y-3 text-xs text-neutral-300">
              <p className="text-neutral-400">To install on macOS (Safari, Chrome, or Edge):</p>
              <div className="p-3 rounded-xl bg-black border border-[#222] space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>
                    <strong className="text-white">In Safari (macOS Sonoma+):</strong> Click <strong className="text-white">File</strong> in the top menu bar $\rightarrow$ select <strong className="text-white">&ldquo;Add to Dock...&rdquo;</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 pt-1.5 border-t border-[#1f1f22]">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>
                    <strong className="text-white">In Chrome / Edge:</strong> Click the <strong className="text-white">Install</strong> icon in the address bar $\rightarrow$ click <strong className="text-white">&ldquo;Install&rdquo;</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 pt-1.5 border-t border-[#1f1f22]">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>The Beginning app will appear in your Mac Dock and Applications folder.</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5">
            <button
              onClick={() => setInstructionsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer shadow"
            >
              Got it
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

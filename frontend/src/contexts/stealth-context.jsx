"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getStoredVpsUrl } from "@/lib/api-client";

import { ServerConfigModal } from "@/components/decoy/server-config-modal";

const StealthContext = createContext(null);
const DEFAULT_PASSCODE = "2007";

export function isAndroidNativeApp() {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_IS_CAPACITOR_BUILD === "true") return true;
  if (window.location.protocol === "capacitor:") return true;
  if (typeof window.Capacitor !== "undefined") {
    if (window.Capacitor?.isNativePlatform?.()) return true;
    if (window.Capacitor?.getPlatform?.() === "android") return true;
  }
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua)) {
    if (
      typeof window.Capacitor !== "undefined" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "10.0.2.2"
    ) {
      return true;
    }
  }

  return false;
}

export function StealthProvider({ children }) {
  const [isStealthEnabled, setIsStealthEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState(DEFAULT_PASSCODE);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [hasVpsConfigured, setHasVpsConfigured] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from storage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const isAndroid = isAndroidNativeApp();

      // Stealth mode is strictly for the Android App
      if (isAndroid) {
        const storedStealthEnabled = localStorage.getItem("firm_stealth_enabled");
        if (storedStealthEnabled !== null) {
          setIsStealthEnabled(storedStealthEnabled === "true");
        } else {
          // Default to true on Android app
          setIsStealthEnabled(true);
        }
      } else {
        // On regular web/desktop browsers, stealth mode is disabled
        setIsStealthEnabled(false);
      }

      const storedPasscode = localStorage.getItem("firm_stealth_passcode");
      if (storedPasscode) {
        setPasscode(storedPasscode);
      }

      const sessionUnlocked = sessionStorage.getItem("firm_stealth_unlocked") === "true";
      setIsUnlocked(sessionUnlocked);

      const vpsUrl = getStoredVpsUrl();
      setHasVpsConfigured(!!vpsUrl);
    } catch {
      // Storage access error
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Unlock with passcode
  const unlock = useCallback(
    (enteredPin) => {
      const currentPin =
        typeof window !== "undefined"
          ? localStorage.getItem("firm_stealth_passcode") || passcode || DEFAULT_PASSCODE
          : DEFAULT_PASSCODE;

      if (enteredPin === currentPin) {
        setIsUnlocked(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("firm_stealth_unlocked", "true");
        }
        return true;
      }
      return false;
    },
    [passcode]
  );

  // Instantly lock back to Calculator decoy (Panic button)
  const lock = useCallback(() => {
    setIsUnlocked(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("firm_stealth_unlocked");
      window.location.href = "/";
    }
  }, []);

  // Update master passcode
  const updatePasscode = useCallback((newPin) => {
    if (!newPin || newPin.length < 4) return false;
    setPasscode(newPin);
    if (typeof window !== "undefined") {
      localStorage.setItem("firm_stealth_passcode", newPin);
    }
    return true;
  }, []);

  // Toggle stealth mode
  const setStealthActive = useCallback((active) => {
    setIsStealthEnabled(active);
    if (typeof window !== "undefined") {
      localStorage.setItem("firm_stealth_enabled", active ? "true" : "false");
    }
  }, []);

  // Check/update VPS configured status
  const refreshVpsStatus = useCallback(() => {
    const url = getStoredVpsUrl();
    setHasVpsConfigured(!!url);
    return !!url;
  }, []);

  const value = {
    isStealthEnabled,
    setStealthActive,
    isUnlocked,
    unlock,
    lock,
    passcode,
    updatePasscode,
    isServerModalOpen,
    setIsServerModalOpen,
    hasVpsConfigured,
    refreshVpsStatus,
    isInitialized,
    isAndroidNative: typeof window !== "undefined" ? isAndroidNativeApp() : false,
  };

  return (
    <StealthContext.Provider value={value}>
      {children}
      {typeof window !== "undefined" && isAndroidNativeApp() && (
        <ServerConfigModal
          open={isServerModalOpen}
          onOpenChange={setIsServerModalOpen}
        />
      )}
    </StealthContext.Provider>
  );
}

export function useStealth() {
  const context = useContext(StealthContext);
  if (!context) {
    throw new Error("useStealth must be used within a StealthProvider");
  }
  return context;
}

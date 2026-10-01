"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStealth } from "@/contexts/stealth-context";
import { useAuth } from "@/contexts/auth-context";
import {
  Delete,
  History,
  Calculator as CalcIcon,
} from "lucide-react";

export function CalculatorVault() {
  const router = useRouter();
  const { unlock, passcode } = useStealth();
  const { isAuthenticated, user } = useAuth();

  // Calculator Math State
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Long-press secret trigger state
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressIntervalRef = useRef(null);

  // Haptic feedback
  const triggerHaptic = (ms = 15) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  };

  // Safe Math Evaluation
  const evaluateMath = (expr) => {
    try {
      const sanitized = expr
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .replace(/%/g, "/100")
        .replace(/[^0-9+\-*/().]/g, "");

      if (!sanitized) return "0";
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${sanitized})`)();
      if (!isFinite(result) || isNaN(result)) return "Error";
      return String(Math.round(result * 100000000) / 100000000);
    } catch {
      return "Error";
    }
  };

  // Handle Input Digit or Decimal
  const handleInput = useCallback((val) => {
    triggerHaptic(10);

    setDisplay((currentDisplay) => {
      if (currentDisplay === "Error") {
        setExpression("");
        return val === "." ? "0." : val;
      }

      if (hasCalculated) {
        setHasCalculated(false);
        setExpression("");
        return val === "." ? "0." : val;
      }

      if (val === ".") {
        if (!currentDisplay.includes(".")) {
          return currentDisplay + ".";
        }
        return currentDisplay;
      }

      if (currentDisplay === "0") {
        return val;
      }

      if (currentDisplay.length < 12) {
        return currentDisplay + val;
      }
      return currentDisplay;
    });
  }, [hasCalculated]);

  // Handle Operator (+, -, *, /)
  const handleOperator = useCallback((op) => {
    triggerHaptic(15);
    if (display === "Error") return;

    setExpression(`${display} ${op} `);
    setDisplay("0");
    setHasCalculated(false);
  }, [display]);

  // Handle Clear / All Clear
  const handleClear = useCallback(() => {
    triggerHaptic(12);
    setDisplay("0");
    setExpression("");
    setHasCalculated(false);
  }, []);

  // Handle Backspace
  const handleBackspace = useCallback(() => {
    triggerHaptic(10);
    setDisplay((prev) => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      return "0";
    });
  }, []);

  // Handle Percent
  const handlePercent = useCallback(() => {
    triggerHaptic(10);
    const num = parseFloat(display);
    if (!isNaN(num)) {
      setDisplay(String(num / 100));
    }
  }, [display]);

  // Handle Sign Toggle (+/-)
  const handleToggleSign = useCallback(() => {
    triggerHaptic(10);
    const num = parseFloat(display);
    if (!isNaN(num) && num !== 0) {
      setDisplay(String(-num));
    }
  }, [display]);

  // Trigger Vault Unlock into Main Application or Login
  const triggerUnlock = useCallback((pinToTry) => {
    triggerHaptic([30, 50, 30]);
    const pin = pinToTry || display;
    const success = unlock(pin);

    if (success) {
      if (isAuthenticated && user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [display, unlock, isAuthenticated, user, router]);

  // Handle Equals (=) — PRIMARY SECRET TRIGGER
  const handleEquals = useCallback(() => {
    triggerHaptic(20);

    // 1. Check if the entered number matches master passcode!
    const targetPasscode = passcode || "2007";
    if (display === targetPasscode) {
      triggerUnlock(targetPasscode);
      return;
    }

    // Normal calculation
    if (!expression && display !== "0") {
      return;
    }

    const fullExpr = `${expression}${display}`;
    const result = evaluateMath(fullExpr);

    if (result !== "Error") {
      setHistory((prev) => [
        { expr: fullExpr, result },
        ...prev.slice(0, 19),
      ]);
    }

    setDisplay(result);
    setExpression("");
    setHasCalculated(true);
  }, [display, expression, passcode, triggerUnlock]);

  // Long press on = button (Secondary Secret Trigger)
  const startLongPressEquals = () => {
    setLongPressProgress(0);
    const startTime = Date.now();
    longPressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / 1800) * 100);
      setLongPressProgress(pct);
      if (elapsed >= 1800) {
        clearInterval(longPressIntervalRef.current);
        longPressIntervalRef.current = null;
        triggerUnlock(passcode || "2007");
      }
    }, 40);
  };

  const endLongPressEquals = () => {
    if (longPressIntervalRef.current) {
      clearInterval(longPressIntervalRef.current);
      longPressIntervalRef.current = null;
    }
    setLongPressProgress(0);
  };

  // Keyboard navigation & numpad support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      const key = e.key;

      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        handleInput(key);
      } else if (key === ".") {
        e.preventDefault();
        handleInput(".");
      } else if (key === "+" || key === "-") {
        e.preventDefault();
        handleOperator(key === "-" ? "−" : "+");
      } else if (key === "*") {
        e.preventDefault();
        handleOperator("×");
      } else if (key === "/") {
        e.preventDefault();
        handleOperator("÷");
      } else if (key === "Enter" || key === "=") {
        e.preventDefault();
        handleEquals();
      } else if (key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (key === "Escape") {
        e.preventDefault();
        handleClear();
      } else if (key === "%") {
        e.preventDefault();
        handlePercent();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleInput, handleOperator, handleEquals, handleBackspace, handleClear, handlePercent]);

  // Android hardware back button handler
  useEffect(() => {
    let backListener = null;

    if (typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.()) {
      import("@capacitor/app")
        .then(({ App }) => {
          App.addListener("backButton", () => {
            if (showHistory) {
              setShowHistory(false);
            } else if (display !== "0") {
              setDisplay("0");
              setExpression("");
            }
          }).then((listener) => {
            backListener = listener;
          });
        })
        .catch(() => {});
    }

    return () => {
      if (backListener?.remove) backListener.remove();
    };
  }, [showHistory, display]);

  // Format display numbers with commas
  const formatDisplay = (val) => {
    if (val === "Error") return "Error";
    const parts = val.split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
  };

  return (
    <div className="h-full w-full bg-black text-white flex flex-col justify-between p-4 sm:p-6 select-none font-sans overflow-hidden">
      {/* Top Bar: Minimalist Title & History Drawer Toggle */}
      <header className="flex items-center justify-between pt-safe pb-1 text-zinc-400 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <CalcIcon className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-medium tracking-wide uppercase font-mono text-zinc-400">
            Calculator
          </span>
        </div>

        <button
          id="calculator-history-btn"
          type="button"
          onClick={() => {
            triggerHaptic(10);
            setShowHistory(!showHistory);
          }}
          className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-zinc-900 active:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer min-w-[44px]"
          aria-label="Calculation History"
        >
          <History className="h-4.5 w-4.5" />
        </button>
      </header>

      {/* History Drawer Overlay */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-6 flex flex-col justify-between animate-in fade-in duration-150 pt-safe pb-safe">
          <div className="space-y-4 max-w-md mx-auto w-full">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-sm font-semibold text-zinc-200">Calculation History</span>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-xs font-medium text-amber-400 hover:text-amber-300 py-1.5 px-3 rounded-lg hover:bg-zinc-900 cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-12">No calculation history</p>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setDisplay(item.result);
                      setShowHistory(false);
                    }}
                    className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 cursor-pointer hover:border-zinc-700 transition-colors"
                  >
                    <p className="text-[11px] font-mono text-zinc-400">{item.expr} =</p>
                    <p className="text-base font-semibold text-white font-mono mt-0.5">{item.result}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          {history.length > 0 && (
            <div className="max-w-md mx-auto w-full pt-3 border-t border-zinc-800 text-center">
              <button
                type="button"
                onClick={() => setHistory([])}
                className="text-xs text-red-400 hover:text-red-300 py-2 cursor-pointer font-medium"
              >
                Clear History
              </button>
            </div>
          )}
        </div>
      )}

      {/* Calculator Display */}
      <div className="flex-1 flex flex-col justify-end px-2 pb-4 max-w-sm mx-auto w-full min-h-[100px]">
        {/* Secondary Expression preview */}
        <div className="text-right text-xs sm:text-sm font-mono text-zinc-500 h-6 truncate tracking-wider">
          {expression}
        </div>

        {/* Main Result Display */}
        <div className="text-right font-light tracking-tight text-white select-text overflow-hidden text-ellipsis whitespace-nowrap mt-1">
          <span
            id="calculator-display"
            className={`font-mono transition-all inline-block ${
              display.length > 10
                ? "text-3xl sm:text-4xl"
                : display.length > 7
                ? "text-4xl sm:text-5xl"
                : "text-5xl sm:text-6xl"
            }`}
          >
            {formatDisplay(display)}
          </span>
        </div>
      </div>

      {/* Keypad Grid (Android Native Style) */}
      <div className="max-w-sm mx-auto w-full pb-safe shrink-0">
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {/* ROW 1: Clear, +/-, %, ÷ */}
          <button
            id="calc-key-clear"
            type="button"
            onClick={handleClear}
            className="h-14 sm:h-16 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-100 font-medium text-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm"
          >
            {display !== "0" || expression ? "C" : "AC"}
          </button>

          <button
            type="button"
            onClick={handleToggleSign}
            className="h-14 sm:h-16 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-100 font-medium text-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm"
          >
            ±
          </button>

          <button
            type="button"
            onClick={handlePercent}
            className="h-14 sm:h-16 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-100 font-medium text-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm"
          >
            %
          </button>

          <button
            type="button"
            onClick={() => handleOperator("÷")}
            className="h-14 sm:h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md"
          >
            ÷
          </button>

          {/* ROW 2: 7, 8, 9, × */}
          {["7", "8", "9"].map((num) => (
            <button
              key={num}
              id={`calc-key-${num}`}
              type="button"
              onClick={() => handleInput(num)}
              className="h-14 sm:h-16 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-normal text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-zinc-800/50 shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOperator("×")}
            className="h-14 sm:h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md"
          >
            ×
          </button>

          {/* ROW 3: 4, 5, 6, − */}
          {["4", "5", "6"].map((num) => (
            <button
              key={num}
              id={`calc-key-${num}`}
              type="button"
              onClick={() => handleInput(num)}
              className="h-14 sm:h-16 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-normal text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-zinc-800/50 shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOperator("−")}
            className="h-14 sm:h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md"
          >
            −
          </button>

          {/* ROW 4: 1, 2, 3, + */}
          {["1", "2", "3"].map((num) => (
            <button
              key={num}
              id={`calc-key-${num}`}
              type="button"
              onClick={() => handleInput(num)}
              className="h-14 sm:h-16 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-normal text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-zinc-800/50 shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOperator("+")}
            className="h-14 sm:h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md"
          >
            +
          </button>

          {/* ROW 5: 0, ., Backspace, = (SECRET TRIGGER) */}
          <button
            id="calc-key-0"
            type="button"
            onClick={() => handleInput("0")}
            className="h-14 sm:h-16 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-normal text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-zinc-800/50 shadow-sm"
          >
            0
          </button>

          <button
            id="calc-key-dot"
            type="button"
            onClick={() => handleInput(".")}
            className="h-14 sm:h-16 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-normal text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-zinc-800/50 shadow-sm"
          >
            .
          </button>

          <button
            id="calc-key-backspace"
            type="button"
            onClick={handleBackspace}
            className="h-14 sm:h-16 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-normal text-xl active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-zinc-800/50 shadow-sm"
            aria-label="Delete"
          >
            <Delete className="h-5 w-5" />
          </button>

          {/* SECRET VAULT TRIGGER BUTTON: "=" */}
          <div className="relative">
            <button
              id="calc-key-equals"
              type="button"
              onClick={handleEquals}
              onMouseDown={startLongPressEquals}
              onMouseUp={endLongPressEquals}
              onMouseLeave={endLongPressEquals}
              onTouchStart={startLongPressEquals}
              onTouchEnd={endLongPressEquals}
              className="w-full h-14 sm:h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md relative overflow-hidden"
              aria-label="Equals"
            >
              =
              {longPressProgress > 0 && (
                <span
                  className="absolute inset-0 bg-white/30 pointer-events-none transition-all"
                  style={{ width: `${longPressProgress}%` }}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

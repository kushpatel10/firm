"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStealth } from "@/contexts/stealth-context";
import { getStoredVpsUrl } from "@/lib/api-client";
import {
  Delete,
  History,
  Calculator as CalcIcon,
  Check,
  ChevronRight,
  Shield,
  Sparkles,
} from "lucide-react";

export function CalculatorVault() {
  const router = useRouter();
  const { unlock, setIsServerModalOpen, passcode } = useStealth();

  // Calculator Math State
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Hidden Trigger State
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressTimerRef = useRef(null);
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
      // Sanitize: only allow numbers and basic math operators
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
      // Format decimals cleanly
      return String(Math.round(result * 100000000) / 100000000);
    } catch {
      return "Error";
    }
  };

  // Handle Input Digit or Operator
  const handleInput = (val) => {
    triggerHaptic(10);

    if (display === "Error") {
      setDisplay(val);
      setExpression("");
      return;
    }

    if (hasCalculated) {
      if (["+", "−", "×", "÷"].includes(val)) {
        setExpression(`${display} ${val} `);
        setDisplay("0");
      } else {
        setDisplay(val);
        setExpression("");
      }
      setHasCalculated(false);
      return;
    }

    if (val === ".") {
      if (!display.includes(".")) {
        setDisplay((prev) => prev + ".");
      }
      return;
    }

    if (display === "0") {
      setDisplay(val);
    } else {
      if (display.length < 12) {
        setDisplay((prev) => prev + val);
      }
    }
  };

  // Handle Operator (+, -, *, /)
  const handleOperator = (op) => {
    triggerHaptic(15);
    if (display === "Error") return;

    setExpression(`${expression}${display} ${op} `);
    setDisplay("0");
    setHasCalculated(false);
  };

  // Handle Clear / All Clear
  const handleClear = () => {
    triggerHaptic(12);
    setDisplay("0");
    setExpression("");
    setHasCalculated(false);
  };

  // Handle Backspace
  const handleBackspace = () => {
    triggerHaptic(10);
    if (display.length > 1) {
      setDisplay((prev) => prev.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  // Handle Percent
  const handlePercent = () => {
    triggerHaptic(10);
    const num = parseFloat(display);
    if (!isNaN(num)) {
      setDisplay(String(num / 100));
    }
  };

  // Handle Sign Toggle (+/-)
  const handleToggleSign = () => {
    triggerHaptic(10);
    const num = parseFloat(display);
    if (!isNaN(num) && num !== 0) {
      setDisplay(String(-num));
    }
  };

  // Trigger Vault Unlock
  const triggerUnlock = () => {
    triggerHaptic([30, 50, 30]);
    const success = unlock(display);
    if (success) {
      const vpsUrl = getStoredVpsUrl();
      if (!vpsUrl) {
        setIsServerModalOpen(true);
      } else {
        router.push("/login");
      }
    }
  };

  // Handle Equals (=) — PRIMARY SECRET TRIGGER
  const handleEquals = () => {
    triggerHaptic(20);

    // 1. Check if the entered number matches master passcode!
    const targetPasscode = passcode || "2007";
    if (display === targetPasscode) {
      triggerUnlock();
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
  };

  // Long press on = button (Secondary Secret Trigger)
  const startLongPressEquals = () => {
    setLongPressProgress(0);
    const startTime = Date.now();
    longPressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / 2000) * 100);
      setLongPressProgress(pct);
      if (elapsed >= 2000) {
        clearInterval(longPressIntervalRef.current);
        triggerUnlock();
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

  // Format display numbers with commas
  const formatDisplay = (val) => {
    if (val === "Error") return "Error";
    const parts = val.split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
  };

  return (
    <div className="min-h-[100dvh] w-full bg-black text-white flex flex-col justify-between p-4 sm:p-6 select-none font-sans overflow-hidden">
      {/* Top Bar: Minimalist Title & History Drawer Toggle */}
      <header className="flex items-center justify-between pt-safe pb-2 text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <CalcIcon className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-medium tracking-wide uppercase font-mono text-zinc-400">
            Calculator
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic(10);
            setShowHistory(!showHistory);
          }}
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          aria-label="History"
        >
          <History className="h-4 w-4" />
        </button>
      </header>

      {/* History Drawer Overlay */}
      {showHistory && (
        <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-md p-6 flex flex-col justify-between animate-in fade-in duration-150">
          <div className="space-y-4 max-w-md mx-auto w-full">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-sm font-semibold text-zinc-200">Calculation History</span>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-xs text-amber-400 hover:underline cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-8">No calculation history</p>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setDisplay(item.result);
                      setShowHistory(false);
                    }}
                    className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 cursor-pointer hover:border-zinc-700 transition-colors"
                  >
                    <p className="text-[11px] font-mono text-zinc-400">{item.expr} =</p>
                    <p className="text-base font-semibold text-white font-mono mt-0.5">{item.result}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setHistory([])}
              className="text-xs text-red-400 hover:text-red-300 text-center py-2 cursor-pointer"
            >
              Clear History
            </button>
          )}
        </div>
      )}

      {/* Calculator Display */}
      <div className="flex-1 flex flex-col justify-end px-2 pb-6 max-w-sm mx-auto w-full">
        {/* Secondary Expression preview */}
        <div className="text-right text-xs sm:text-sm font-mono text-zinc-500 h-6 truncate tracking-wider">
          {expression}
        </div>

        {/* Main Result Display */}
        <div className="text-right font-light tracking-tight text-white select-text overflow-hidden text-ellipsis whitespace-nowrap mt-1">
          <span
            className={`font-mono transition-all ${
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

      {/* Keypad Grid (Classic Apple/Android OLED Style) */}
      <div className="max-w-sm mx-auto w-full pb-safe">
        <div className="grid grid-cols-4 gap-3">
          {/* ROW 1: Clear, +/-, %, ÷ */}
          <button
            type="button"
            onClick={handleClear}
            className="h-16 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-100 font-medium text-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm"
          >
            {display !== "0" || expression ? "C" : "AC"}
          </button>

          <button
            type="button"
            onClick={handleToggleSign}
            className="h-16 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-100 font-medium text-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm"
          >
            ±
          </button>

          <button
            type="button"
            onClick={handlePercent}
            className="h-16 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-100 font-medium text-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm"
          >
            %
          </button>

          <button
            type="button"
            onClick={() => handleOperator("÷")}
            className="h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md"
          >
            ÷
          </button>

          {/* ROW 2: 7, 8, 9, × */}
          {["7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleInput(num)}
              className="h-16 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-normal text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-zinc-800/50 shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOperator("×")}
            className="h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md"
          >
            ×
          </button>

          {/* ROW 3: 4, 5, 6, − */}
          {["4", "5", "6"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleInput(num)}
              className="h-16 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-normal text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-zinc-800/50 shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOperator("−")}
            className="h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md"
          >
            −
          </button>

          {/* ROW 4: 1, 2, 3, + */}
          {["1", "2", "3"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleInput(num)}
              className="h-16 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-normal text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-zinc-800/50 shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOperator("+")}
            className="h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md"
          >
            +
          </button>

          {/* ROW 5: 0, ., Backspace, = (SECRET TRIGGER) */}
          <button
            type="button"
            onClick={() => handleInput("0")}
            className="h-16 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-normal text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-zinc-800/50 shadow-sm"
          >
            0
          </button>

          <button
            type="button"
            onClick={() => handleInput(".")}
            className="h-16 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-normal text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-zinc-800/50 shadow-sm"
          >
            .
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-16 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-normal text-xl active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-zinc-800/50 shadow-sm"
            aria-label="Delete"
          >
            <Delete className="h-5 w-5" />
          </button>

          {/* SECRET VAULT TRIGGER BUTTON: "=" */}
          <div className="relative">
            <button
              type="button"
              onClick={handleEquals}
              onMouseDown={startLongPressEquals}
              onMouseUp={endLongPressEquals}
              onMouseLeave={endLongPressEquals}
              onTouchStart={startLongPressEquals}
              onTouchEnd={endLongPressEquals}
              className="w-full h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md relative overflow-hidden"
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

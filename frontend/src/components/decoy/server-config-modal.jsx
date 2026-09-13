"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Server,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";
import {
  getStoredVpsUrl,
  setApiBaseUrl,
  clearApiBaseUrl,
  testServerConnection,
  normalizeServerUrl,
} from "@/lib/api-client";
import { useStealth } from "@/contexts/stealth-context";

export function ServerConfigModal({ open, onOpenChange, onSaved }) {
  const {
    isStealthEnabled,
    setStealthActive,
    passcode,
    updatePasscode,
    refreshVpsStatus,
  } = useStealth();

  const [rawUrl, setRawUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  // Stealth settings state
  const [newPin, setNewPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      const current = getStoredVpsUrl() || "http://10.0.2.2:4000";
      setRawUrl(current);
      setTestResult(null);
      setNewPin(passcode || "2007");
      setPinSuccess(false);
    }
  }, [open, passcode]);

  const handleTestConnection = async () => {
    const target = rawUrl.trim() || "http://10.0.2.2:4000";

    setTesting(true);
    setTestResult(null);

    const res = await testServerConnection(target);
    setTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    const target = rawUrl.trim() || "http://10.0.2.2:4000";

    setSaving(true);
    const normalized = setApiBaseUrl(target);
    refreshVpsStatus();
    setSaving(false);

    if (onSaved) {
      onSaved(normalized);
    }
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleClearServer = () => {
    clearApiBaseUrl();
    setRawUrl("");
    setTestResult(null);
    refreshVpsStatus();
  };

  const handleSavePin = () => {
    if (newPin.length >= 4) {
      updatePasscode(newPin);
      setPinSuccess(true);
      setTimeout(() => setPinSuccess(false), 2500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden bg-background border-border/80">
        <DialogHeader className="p-5 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight">
                Server & Stealth Settings
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure your firm VPS URL and camouflage parameters
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="server" className="w-full">
          <div className="px-5 pt-3">
            <TabsList className="grid w-full grid-cols-2 h-9 p-0.5 bg-muted/50 rounded-lg">
              <TabsTrigger value="server" className="text-xs gap-1.5 rounded-md">
                <Globe className="h-3.5 w-3.5" />
                <span>VPS Connection</span>
              </TabsTrigger>
              <TabsTrigger value="stealth" className="text-xs gap-1.5 rounded-md">
                <Shield className="h-3.5 w-3.5" />
                <span>Decoy & Security</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: SERVER CONFIG */}
          <TabsContent value="server" className="p-5 space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center justify-between">
                <span>Dashboard / VPS Server URL</span>
                {rawUrl && (
                  <button
                    type="button"
                    onClick={handleClearServer}
                    className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    Clear URL
                  </button>
                )}
              </Label>
              <div className="relative">
                <Input
                  placeholder="https://firm.yourdomain.com or http://192.168.1.100:4000"
                  value={rawUrl}
                  onChange={(e) => {
                    setRawUrl(e.target.value);
                    setTestResult(null);
                  }}
                  className="font-mono text-xs pr-8 h-10 bg-muted/20"
                />
                <Globe className="absolute right-2.5 top-3 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Enter your firm&apos;s cloud VPS domain or local network IP. One universal app connects to any firm.
              </p>
            </div>

            {/* Quick Presets for testing */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                Quick Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Local Backend", url: "http://localhost:4000" },
                  { label: "Android Emulator", url: "http://10.0.2.2:4000" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setRawUrl(preset.url);
                      setTestResult(null);
                    }}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-secondary/80 hover:bg-secondary text-foreground border border-border/60 transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Connection Test Result */}
            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs">
                    {testResult.success ? "Connection Successful!" : "Connection Failed"}
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-90 break-all">
                    {testResult.success
                      ? `${testResult.service} (v${testResult.version}) • Latency: ${testResult.latency}ms`
                      : testResult.error}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testing || !rawUrl.trim()}
                className="text-xs h-9 gap-1.5 border-border/80 flex-1 cursor-pointer"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Testing…</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span>Test Connection</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saving || !rawUrl.trim()}
                className="text-xs h-9 gap-1.5 flex-1 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Save & Connect</span>
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: STEALTH & CAMOUFLAGE */}
          <TabsContent value="stealth" className="p-5 space-y-4 pt-4">
            <div className="rounded-lg border border-border/70 p-3.5 space-y-2 bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">Calculator Vault Camouflage</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Launch app as a fully functioning Calculator until unlocked.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="stealth-toggle"
                  checked={isStealthEnabled}
                  onChange={(e) => setStealthActive(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Master Stealth Passcode</Label>
              <div className="relative">
                <Input
                  type={showPin ? "text" : "password"}
                  maxLength={8}
                  placeholder="e.g. 2007"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="font-mono text-center tracking-widest text-sm h-10 pr-10 bg-muted/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Enter your passcode and press <span className="font-mono font-semibold text-amber-500">=</span> on the calculator to unlock. (Or long-press = for 2 seconds). Default: <span className="font-mono font-semibold">2007</span>.
              </p>
            </div>

            {pinSuccess && (
              <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Passcode updated successfully!</span>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSavePin}
              disabled={newPin.length < 4}
              className="w-full text-xs h-9 gap-1.5 cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Update Passcode</span>
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="p-4 pt-2 border-t border-border/60 bg-muted/10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange && onOpenChange(false)}
            className="text-xs cursor-pointer ml-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

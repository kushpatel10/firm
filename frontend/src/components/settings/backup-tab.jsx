"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Cloud,
  CloudOff,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  HardDrive,
  Lock,
  Calendar,
  Sparkles,
  UploadCloud,
  FileCheck2,
  FileCode,
  Layers,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { backupService } from "@/services/backup.service";

const TIMEZONES = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "Europe/London",
  "Asia/Dubai",
  "Asia/Singapore",
];

const RETENTION_OPTIONS = [
  { value: 7, label: "Keep last 7 days" },
  { value: 14, label: "Keep last 14 days" },
  { value: 30, label: "Keep last 30 days (Recommended)" },
  { value: 60, label: "Keep last 60 days" },
  { value: 90, label: "Keep last 90 days" },
];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function BackupSettingsTab({ firmId, firmName }) {
  // Config state
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  // Form inputs
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [backupTime, setBackupTime] = useState("02:00");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [retentionDays, setRetentionDays] = useState(30);

  // Immediate Backup modal
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState("");
  const [exportToDrive, setExportToDrive] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Drive files
  const [driveFiles, setDriveFiles] = useState([]);
  const [loadingDriveFiles, setLoadingDriveFiles] = useState(false);

  // Local upload state
  const [localFile, setLocalFile] = useState(null);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Inspection & Restore Modal state
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectTarget, setInspectTarget] = useState(null); // { type: 'drive', fileId, fileName } | { type: 'local', file }
  const [inspectPassphrase, setInspectPassphrase] = useState("");
  const [inspecting, setInspecting] = useState(false);
  const [inspectResult, setInspectResult] = useState(null);
  const [inspectError, setInspectError] = useState("");

  // Restore options
  const [restoreMode, setRestoreMode] = useState("NEW_FIRM"); // "NEW_FIRM" | "OVERWRITE"
  const [confirmNameInput, setConfirmNameInput] = useState("");
  const [restoring, setRestoring] = useState(false);

  // Audit history
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load config & drive status
  const loadConfig = useCallback(async () => {
    if (!firmId) return;
    setLoadingConfig(true);
    try {
      const data = await backupService.getConfig(firmId);
      setConfig(data);
      if (data) {
        setAutoBackupEnabled(data.autoBackupEnabled ?? false);
        setBackupTime(data.backupTime || "02:00");
        setTimezone(data.timezone || "Asia/Kolkata");
        setRetentionDays(data.retentionDays || 30);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load backup configuration");
    } finally {
      setLoadingConfig(false);
    }
  }, [firmId]);

  // Load Drive files
  const loadDriveFiles = useCallback(async () => {
    if (!firmId) return;
    setLoadingDriveFiles(true);
    try {
      const data = await backupService.getDriveFiles(firmId);
      setDriveFiles(data?.files || []);
    } catch {
      setDriveFiles([]);
    } finally {
      setLoadingDriveFiles(false);
    }
  }, [firmId]);

  // Load Audit History
  const loadHistory = useCallback(async () => {
    if (!firmId) return;
    setLoadingHistory(true);
    try {
      const res = await backupService.getHistory(firmId, { pageSize: 15 });
      setHistory(res?.data || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [firmId]);

  useEffect(() => {
    loadConfig();
    loadDriveFiles();
    loadHistory();
  }, [loadConfig, loadDriveFiles, loadHistory]);

  // Save Schedule settings
  const handleSaveSettings = async () => {
    setSavingConfig(true);
    try {
      await backupService.updateConfig(firmId, {
        autoBackupEnabled,
        backupTime,
        timezone,
        retentionDays,
      });
      toast.success("Backup schedule settings saved!");
      await loadConfig();
    } catch (err) {
      toast.error(err.message || "Failed to save backup settings");
    } finally {
      setSavingConfig(false);
    }
  };

  // Connect Google Drive
  const handleConnectDrive = async () => {
    try {
      const authUrl = await backupService.getGoogleAuthUrl(
        firmId,
        "/dashboard/settings?tab=backups"
      );
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (err) {
      toast.error(err.message || "Failed to start Google authentication");
    }
  };

  // Disconnect Google Drive
  const handleDisconnectDrive = async () => {
    if (!confirm("Are you sure you want to disconnect Google Drive? Automated backups will pause.")) {
      return;
    }
    try {
      await backupService.disconnectGoogle(firmId);
      toast.success("Google Drive disconnected");
      await loadConfig();
      await loadDriveFiles();
    } catch (err) {
      toast.error(err.message || "Failed to disconnect Google Drive");
    }
  };

  // Execute Immediate Backup
  const handleExecuteBackupNow = async () => {
    setExporting(true);
    try {
      if (exportToDrive) {
        await backupService.exportNow(firmId, {
          passphrase: exportPassphrase || undefined,
          uploadToDrive: true,
        });
        toast.success("Snapshot created and uploaded to Google Drive!");
        setExportModalOpen(false);
        setExportPassphrase("");
        await loadConfig();
        await loadDriveFiles();
        await loadHistory();
      } else {
        await backupService.downloadExport(firmId, exportPassphrase);
        toast.success("Encrypted backup downloaded successfully!");
        setExportModalOpen(false);
        setExportPassphrase("");
        await loadHistory();
      }
    } catch (err) {
      toast.error(err.message || "Immediate backup failed");
    } finally {
      setExporting(false);
    }
  };

  // Open inspection modal for Google Drive file
  const handleInspectDriveFile = (file) => {
    setInspectTarget({ type: "drive", fileId: file.id, fileName: file.name });
    setInspectPassphrase("");
    setInspectResult(null);
    setInspectError("");
    setRestoreMode("NEW_FIRM");
    setConfirmNameInput("");
    setInspectModalOpen(true);
  };

  // Open inspection modal for local file
  const handleInspectLocalFile = (file) => {
    if (!file) return;
    setInspectTarget({ type: "local", file, fileName: file.name });
    setInspectPassphrase("");
    setInspectResult(null);
    setInspectError("");
    setRestoreMode("NEW_FIRM");
    setConfirmNameInput("");
    setInspectModalOpen(true);
  };

  // Run Dry-Run verification
  const handleRunVerification = async () => {
    if (!inspectPassphrase) {
      toast.error("Please enter the backup passphrase");
      return;
    }

    setInspecting(true);
    setInspectError("");

    try {
      let payload;
      if (inspectTarget.type === "local") {
        const formData = new FormData();
        formData.append("backupFile", inspectTarget.file);
        formData.append("passphrase", inspectPassphrase);
        payload = formData;
      } else {
        payload = {
          fileId: inspectTarget.fileId,
          passphrase: inspectPassphrase,
        };
      }

      const res = await backupService.verifyBackup(firmId, payload);
      setInspectResult(res);
      toast.success("Backup authenticated and verified!");
    } catch (err) {
      const msg = err.message || "Failed to authenticate or decrypt backup";
      setInspectError(msg);
      toast.error(msg);
    } finally {
      setInspecting(false);
    }
  };

  // Run Atomic Restore
  const handleExecuteRestore = async () => {
    if (restoreMode === "OVERWRITE") {
      if (confirmNameInput.trim().toLowerCase() !== (firmName || "").toLowerCase()) {
        toast.error(`Please type "${firmName}" exactly to confirm overwrite`);
        return;
      }
    }

    setRestoring(true);
    try {
      let payload;
      if (inspectTarget.type === "local") {
        const formData = new FormData();
        formData.append("backupFile", inspectTarget.file);
        formData.append("passphrase", inspectPassphrase);
        formData.append("mode", restoreMode);
        payload = formData;
      } else {
        payload = {
          fileId: inspectTarget.fileId,
          passphrase: inspectPassphrase,
          mode: restoreMode,
        };
      }

      const res = await backupService.restoreBackup(firmId, payload);
      toast.success(
        restoreMode === "NEW_FIRM"
          ? "Firm cloned successfully as new firm!"
          : "Firm state overwritten successfully!"
      );

      setInspectModalOpen(false);
      await loadHistory();

      // If cloned or overwritten, refresh page after a brief moment
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      toast.error(err.message || "Restoration failed");
    } finally {
      setRestoring(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      if (!dropped.name.endsWith(".firmbak") && !dropped.name.endsWith(".json")) {
        toast.error("Please drop a .firmbak backup file");
        return;
      }
      setLocalFile(dropped);
    }
  };

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────── */}
      {/* 1. Google Drive Cloud Backup Connection Card */}
      {/* ────────────────────────────────────────────── */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Cloud className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  Google Drive Cloud Storage
                  {config?.isConnected ? (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-xs">
                      Not Linked
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Encrypted snapshots stored directly inside your private Google Drive account
                </CardDescription>
              </div>
            </div>

            <div>
              {config?.isConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectDrive}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <CloudOff className="mr-2 h-4 w-4" />
                  Disconnect Account
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnectDrive}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  <Cloud className="mr-2 h-4 w-4" />
                  Connect Google Drive
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {config?.isConnected ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/50 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Connected Google Account</p>
                <p className="font-medium text-foreground truncate mt-0.5">{config?.googleEmail || "Google User"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Destination Folder</p>
                <p className="font-medium text-foreground truncate mt-0.5">Google Drive &gt; Firm Backups</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Cloud Backup</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="font-medium text-foreground">
                    {config?.lastBackupAt ? new Date(config.lastBackupAt).toLocaleString() : "None yet"}
                  </p>
                  {config?.lastBackupStatus && (
                    <Badge
                      className={
                        config.lastBackupStatus === "SUCCESS"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-0 text-[10px]"
                      }
                    >
                      {config.lastBackupStatus}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs sm:text-sm text-blue-900 dark:text-blue-200 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">True Zero-Knowledge Isolation</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All backups are encrypted with <strong>Argon2id + AES-256-GCM</strong> prior to transmission. Google only stores opaque ciphertext files without access to your vouchers, accounting records, or encryption keys.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ────────────────────────────────────────────── */}
      {/* 2. Automated Schedule & Immediate Snapshot     */}
      {/* ────────────────────────────────────────────── */}
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Automated Daily Schedule</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Configure daily automated background snapshots and retention policies
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportModalOpen(true)}
              className="border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Backup Now
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Daily Automated Backup</Label>
              <p className="text-xs text-muted-foreground">
                Automatically export and upload self-contained snapshots at your preferred hour
              </p>
            </div>
            <Switch
              checked={autoBackupEnabled}
              onCheckedChange={setAutoBackupEnabled}
              disabled={!config?.isConnected}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Backup Time (24h)</Label>
              <Input
                type="time"
                value={backupTime}
                onChange={(e) => setBackupTime(e.target.value)}
                disabled={!autoBackupEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone} disabled={!autoBackupEnabled}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Retention Policy</Label>
              <Select
                value={String(retentionDays)}
                onValueChange={(val) => setRetentionDays(parseInt(val, 10))}
                disabled={!autoBackupEnabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETENTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveSettings} disabled={savingConfig} size="sm">
              {savingConfig && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Schedule Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ────────────────────────────────────────────── */}
      {/* 3. Firm Restore & Upload Engine                */}
      {/* ────────────────────────────────────────────── */}
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Restore &amp; Import Engine</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Restore firm records safely with dry-run cryptographic validation and zero corruption risk
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs defaultValue="drive" className="w-full">
            <div className="flex items-center justify-between pb-2">
              <TabsList className="grid w-[320px] grid-cols-2">
                <TabsTrigger value="drive">
                  <Cloud className="mr-2 h-3.5 w-3.5" />
                  Google Drive
                </TabsTrigger>
                <TabsTrigger value="local">
                  <UploadCloud className="mr-2 h-3.5 w-3.5" />
                  Local File
                </TabsTrigger>
              </TabsList>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  loadDriveFiles();
                  loadHistory();
                }}
                className="h-8 text-xs text-muted-foreground"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>

            {/* TAB: From Google Drive */}
            <TabsContent value="drive" className="space-y-3 mt-2">
              {!config?.isConnected ? (
                <div className="p-8 text-center border border-dashed rounded-xl space-y-3">
                  <CloudOff className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Google Drive is not connected</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Link your Google Drive account above to automatically discover and restore your cloud snapshots.
                  </p>
                  <Button size="sm" onClick={handleConnectDrive} variant="outline">
                    Connect Google Drive
                  </Button>
                </div>
              ) : loadingDriveFiles ? (
                <div className="py-12 flex justify-center items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-xl space-y-2">
                  <FileCode className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No snapshots found in Google Drive</p>
                  <p className="text-xs text-muted-foreground">
                    Click "Backup Now" to upload your firm's first encrypted point-in-time snapshot.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-semibold text-xs">File Name</TableHead>
                        <TableHead className="font-semibold text-xs">Date</TableHead>
                        <TableHead className="font-semibold text-xs">Size</TableHead>
                        <TableHead className="text-right font-semibold text-xs">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {driveFiles.map((f) => (
                        <TableRow key={f.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs font-medium text-foreground">
                            {f.name}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {f.createdAt ? new Date(f.createdAt).toLocaleString() : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {formatBytes(f.size)}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Download backup"
                              onClick={() => backupService.downloadDriveFile(firmId, f.id, f.name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              onClick={() => handleInspectDriveFile(f)}
                            >
                              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                              Inspect &amp; Restore
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* TAB: Upload Local .firmbak */}
            <TabsContent value="local" className="space-y-4 mt-2">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-xl cursor-pointer text-center transition-colors ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-border hover:border-primary/50 bg-muted/10 hover:bg-muted/20"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".firmbak,.json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setLocalFile(e.target.files[0]);
                    }
                  }}
                />
                <UploadCloud className="mx-auto h-9 w-9 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to select or drop your .firmbak file</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .firmbak container format v2 (Argon2id + AES-256-GCM)
                </p>
              </div>

              {localFile && (
                <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <FileCheck2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium font-mono">{localFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(localFile.size)}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    onClick={() => handleInspectLocalFile(localFile)}
                  >
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                    Inspect &amp; Restore
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ────────────────────────────────────────────── */}
      {/* 4. Audit History Table                         */}
      {/* ────────────────────────────────────────────── */}
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Backup &amp; Restore Audit History</CardTitle>
          <CardDescription className="text-xs">
            Immutable log of all automated and manual snapshots and restore actions
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingHistory ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No historical records logged yet.</p>
          ) : (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs">Action Type</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">File / Summary</TableHead>
                    <TableHead className="text-xs">Size</TableHead>
                    <TableHead className="text-xs">Duration</TableHead>
                    <TableHead className="text-xs">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="text-xs font-medium">
                        <Badge variant="outline" className="text-[10px]">
                          {h.actionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          className={
                            h.status === "SUCCESS"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]"
                              : h.status === "RUNNING" || h.status === "UPLOADING"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 text-[10px]"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-0 text-[10px]"
                          }
                        >
                          {h.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                        {h.fileName || (h.manifest ? `${h.manifest.sales || 0} sales` : "—")}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {h.fileSizeBytes ? formatBytes(h.fileSizeBytes) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {h.durationMs ? `${(h.durationMs / 1000).toFixed(1)}s` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(h.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ────────────────────────────────────────────── */}
      {/* MODAL: Immediate Backup Now                    */}
      {/* ────────────────────────────────────────────── */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              Generate Immediate Snapshot
            </DialogTitle>
            <DialogDescription className="text-xs">
              Exports a point-in-time snapshot of <strong>{firmName}</strong> protected with Argon2id + AES-256-GCM.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Backup Passphrase (Optional)</Label>
              <Input
                type="password"
                placeholder="Leave blank to use default firm master key"
                value={exportPassphrase}
                onChange={(e) => setExportPassphrase(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                If provided, you will need this exact passphrase when restoring the snapshot.
              </p>
            </div>

            {config?.isConnected && (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Upload to Google Drive</Label>
                  <p className="text-[11px] text-muted-foreground">Save directly to "Firm Backups" cloud folder</p>
                </div>
                <Switch checked={exportToDrive} onCheckedChange={setExportToDrive} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setExportModalOpen(false)} disabled={exporting}>
              Cancel
            </Button>
            <Button onClick={handleExecuteBackupNow} disabled={exporting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {exporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {exportToDrive ? "Export & Upload to Drive" : "Export & Download File"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────── */}
      {/* MODAL: Dry-Run Inspection & Restore Engine     */}
      {/* ────────────────────────────────────────────── */}
      <Dialog open={inspectModalOpen} onOpenChange={setInspectModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Dry-Run Inspection &amp; Restore
            </DialogTitle>
            <DialogDescription className="text-xs truncate font-mono">
              Target: {inspectTarget?.fileName}
            </DialogDescription>
          </DialogHeader>

          {!inspectResult ? (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Enter the encryption passphrase used when creating this backup. The backend will authenticate the cryptographic envelope (Argon2id + AES-256-GCM) without touching the database.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Backup Passphrase</Label>
                <Input
                  type="password"
                  placeholder="Enter passphrase..."
                  value={inspectPassphrase}
                  onChange={(e) => setInspectPassphrase(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRunVerification();
                  }}
                />
              </div>

              {inspectError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{inspectError}</span>
                </div>
              )}

              <DialogFooter>
                <Button variant="ghost" onClick={() => setInspectModalOpen(false)} disabled={inspecting}>
                  Cancel
                </Button>
                <Button onClick={handleRunVerification} disabled={inspecting || !inspectPassphrase}>
                  {inspecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify &amp; Inspect Payload
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-5 py-2">
              {/* Authenticated summary card */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Cryptographically Authenticated
                  </span>
                  <Badge variant="outline" className="border-emerald-500/40 text-[10px] text-emerald-600">
                    Schema v{inspectResult.schemaVersion} Compatible
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 pt-1">
                  <p>
                    <strong className="text-foreground">Firm:</strong> {inspectResult.firmName}
                  </p>
                  <p>
                    <strong className="text-foreground">Created At:</strong>{" "}
                    {new Date(inspectResult.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Manifest counts grid */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Snapshot Payload Contents
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                  <div className="p-2.5 rounded-lg bg-muted/40 border text-center">
                    <p className="text-lg font-bold text-foreground">{inspectResult.manifest?.sales || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Sales</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border text-center">
                    <p className="text-lg font-bold text-foreground">{inspectResult.manifest?.saleItems || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Sale Items</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border text-center">
                    <p className="text-lg font-bold text-foreground">{inspectResult.manifest?.customers || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Customers</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border text-center">
                    <p className="text-lg font-bold text-foreground">{inspectResult.manifest?.inventoryItems || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Inventory</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border text-center">
                    <p className="text-lg font-bold text-foreground">{inspectResult.manifest?.purchases || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Purchases</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border text-center">
                    <p className="text-lg font-bold text-foreground">{inspectResult.manifest?.suppliers || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Suppliers</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border text-center">
                    <p className="text-lg font-bold text-foreground">{inspectResult.manifest?.branches || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Branches</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border text-center">
                    <p className="text-lg font-bold text-foreground">{inspectResult.manifest?.expenses || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Expenses</p>
                  </div>
                </div>
              </div>

              {/* Restoration Target Choice */}
              <div className="space-y-3 pt-1">
                <Label className="text-xs font-semibold">Choose Restoration Target</Label>

                {/* Option 1: Import as New Firm */}
                <div
                  onClick={() => setRestoreMode("NEW_FIRM")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    restoreMode === "NEW_FIRM"
                      ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                      : "border-border hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          restoreMode === "NEW_FIRM"
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-muted-foreground"
                        }`}
                      >
                        {restoreMode === "NEW_FIRM" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        Import as New Firm (Recommended &amp; Safe)
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Creates an isolated firm titled <strong>{inspectResult.firmName} (Restored)</strong> with remapped IDs. Zero risk of overwriting or deleting active data.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option 2: Overwrite Current Firm */}
                <div
                  onClick={() => setRestoreMode("OVERWRITE")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    restoreMode === "OVERWRITE"
                      ? "border-destructive bg-destructive/5 ring-1 ring-destructive"
                      : "border-border hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          restoreMode === "OVERWRITE"
                            ? "border-destructive bg-destructive text-white"
                            : "border-muted-foreground"
                        }`}
                      >
                        {restoreMode === "OVERWRITE" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                        Overwrite Current Firm (Destructive Rollback)
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Cleans existing operational vouchers in <strong>{firmName}</strong> and restores the exact state from this snapshot.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confirm input for Overwrite */}
                {restoreMode === "OVERWRITE" && (
                  <div className="space-y-1.5 pt-2 pl-7">
                    <Label className="text-xs text-destructive font-medium">
                      Type "{firmName}" to confirm destructive overwrite:
                    </Label>
                    <Input
                      placeholder={firmName}
                      value={confirmNameInput}
                      onChange={(e) => setConfirmNameInput(e.target.value)}
                      className="border-destructive/50 focus-visible:ring-destructive"
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="ghost" onClick={() => setInspectResult(null)} disabled={restoring}>
                  Back
                </Button>
                <Button
                  onClick={handleExecuteRestore}
                  disabled={
                    restoring ||
                    (restoreMode === "OVERWRITE" &&
                      confirmNameInput.trim().toLowerCase() !== (firmName || "").toLowerCase())
                  }
                  className={
                    restoreMode === "OVERWRITE"
                      ? "bg-destructive hover:bg-destructive/90 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }
                >
                  {restoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {restoreMode === "OVERWRITE" ? "Confirm & Overwrite Firm" : "Confirm & Import as New Firm"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

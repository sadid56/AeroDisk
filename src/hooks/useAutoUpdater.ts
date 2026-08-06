import { useState, useEffect, useCallback, useRef } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { showToast } from "../providers/ToastProvider";

export function useAutoUpdater() {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string; date?: string; body?: string } | null>(null);
  const [installing, setInstalling] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a reference to the Tauri Update object
  const updateRef = useRef<Update | null>(null);

  const checkForUpdates = useCallback(async (isManual = false) => {
    setChecking(true);
    setError(null);
    try {
      const updateResult = await check();

      if (updateResult) {
        updateRef.current = updateResult;

        const info = {
          version: updateResult.version,
          date: updateResult.date,
          body: updateResult.body,
        };

        setUpdateInfo(info);
        setUpdateAvailable(true);

        // Check if the user has skipped this specific version
        const skippedVersion = localStorage.getItem("hyperdisk_skipped_version");
        if (isManual || skippedVersion !== updateResult.version) {
          setShowModal(true);
        }

        setChecking(false);
        return true;
      } else {
        updateRef.current = null;
        setUpdateInfo(null);
        setUpdateAvailable(false);
        if (isManual) {
          showToast({
            message: "App is Up to Date",
            description: "You are running the latest version of HyperDisk.",
            type: "success",
          });
        }
        setChecking(false);
        return false;
      }
    } catch (err: any) {
      console.error("Update check failed:", err);
      const errMsg = err?.toString() || "Failed to check for updates";
      setError(errMsg);
      setChecking(false);
      if (isManual) {
        if (errMsg.includes("Could not fetch a valid release JSON") || errMsg.includes("404") || errMsg.includes("not found")) {
          showToast({
            message: "App is Up to Date",
            description: "No new updates are currently available on the update server.",
            type: "success",
          });
        } else {
          showToast({
            message: "Update Check Failed",
            description: errMsg || "Please check your internet connection and try again.",
            type: "error",
          });
        }
      }
      return false;
    }
  }, []);

  const startUpdate = useCallback(async () => {
    if (!updateRef.current) {
      showToast({
        message: "No Update Found",
        description: "Please check for updates first.",
        type: "error",
      });
      return;
    }

    setInstalling(true);
    setProgressPercent(0);
    setError(null);

    try {
      let downloaded = 0;
      let total = 0;

      await updateRef.current.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength || 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (total > 0) {
              const percent = Math.round((downloaded / total) * 100);
              setProgressPercent(percent);
            }
            break;
          case "Finished":
            setProgressPercent(100);
            showToast({
              message: "Update Installed!",
              description: "Relaunching HyperDisk to apply updates...",
              type: "success",
              duration: 4000,
            });

            // Record this installation in history log
            const historyJson = localStorage.getItem("hyperdisk_update_history") || "[]";
            try {
              const history = JSON.parse(historyJson);
              history.push({
                version: updateRef?.current?.version,
                installedAt: new Date().toISOString(),
              });
              localStorage.setItem("hyperdisk_update_history", JSON.stringify(history));
            } catch {
              // Ignore history recording failures
            }

            setTimeout(async () => {
              await relaunch();
            }, 1500);
            break;
        }
      });
    } catch (err: any) {
      console.error("Download/install failed:", err);
      setError(err?.toString() || "Failed to download and install update");
      setInstalling(false);
      showToast({
        message: "Installation Failed",
        description: err?.toString() || "Failed to apply update.",
        type: "error",
      });
    }
  }, []);

  const skipUpdate = useCallback(() => {
    if (updateInfo) {
      localStorage.setItem("hyperdisk_skipped_version", updateInfo.version);
    }
    setShowModal(false);
  }, [updateInfo]);

  // Run automatically on startup
  useEffect(() => {
    checkForUpdates(false);
  }, [checkForUpdates]);

  return {
    checking,
    updateAvailable,
    updateInfo,
    installing,
    progressPercent,
    showModal,
    setShowModal,
    error,
    checkForUpdates,
    startUpdate,
    skipUpdate,
  };
}

import { useEffect } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { showToast } from '../providers/ToastProvider';

export function useAutoUpdater() {
  useEffect(() => {
    async function checkForUpdates() {
      try {
        const update = await check();
        if (update?.available) {
          showToast({
            message: `Update Available (v${update.version})`,
            description: 'A new release of AeroDisk is downloading in the background...',
            type: 'info',
            duration: 8000,
          });

          await update.downloadAndInstall((event) => {
            if (event.event === 'Finished') {
              showToast({
                message: 'Update Installed!',
                description: 'Relaunching AeroDisk to apply the update...',
                type: 'success',
                duration: 4000,
              });

              setTimeout(async () => {
                await relaunch();
              }, 2000);
            }
          });
        }
      } catch (err) {
        // Silent fail on dev or offline
      }
    }

    checkForUpdates();
  }, []);
}

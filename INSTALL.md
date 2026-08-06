# macOS Installation Guide for HyperDisk

Since HyperDisk is a high-performance disk space analyzer, it requires Full Disk Access to scan all directories. Because it is distributed as an unsigned application bundle, macOS applies security restrictions (Gatekeeper and translocation quarantine) by default. 

Follow these steps to install HyperDisk and configure it correctly.

---

### Step 1: Install the Application
1. Download the `HyperDisk.dmg` installer from the GitHub Releases page.
2. Double-click the `.dmg` file to open it.
3. Drag the **HyperDisk** application icon into your **Applications** folder.
   > [!IMPORTANT]
   > Do **NOT** run the app directly from the DMG window or the Downloads folder. It must be moved to the `/Applications` directory to allow permissions to persist.

---

### Step 2: Open for the First Time (Gatekeeper Bypass)
Because the application is built as an unsigned binary, opening it normally by double-clicking might show a warning stating that *"HyperDisk can’t be opened because it is from an unidentified developer."*

To open the app:
1. Go to your `/Applications` folder in Finder.
2. **Right-click** (or hold the `Control` key and click) on the **HyperDisk** icon.
3. Select **Open** from the dropdown menu.
4. A warning dialog will appear. Click **Open** to confirm and launch the app.

---

### Step 3: Remove Quarantine Flag (Ensures Permissions Persist)
By default, macOS flags downloaded internet apps as "quarantined." This causes macOS to run the app from a randomized read-only path (app translocation) on every restart, causing it to lose its folder and Full Disk Access permissions.

To tell macOS to trust the app and remember its permissions permanently:
1. Open the **Terminal** app on your Mac (you can find it in Applications > Utilities, or via Spotlight search).
2. Copy and paste the following command, then press `Enter`:
   ```bash
   xattr -cr /Applications/HyperDisk.app
   ```
This removes the quarantine flag so macOS treats it as a standard local application.

---

### Step 4: Grant Full Disk Access
On first startup, HyperDisk will display a prompt asking for Full Disk Access.
1. Click **Grant Access** on the screen.
2. macOS **System Settings** will automatically open directly to the **Privacy & Security > Full Disk Access** page.
3. Find **HyperDisk** in the list and toggle the switch **ON**.
   - *Note: If prompted, enter your macOS password or use Touch ID to authorize the change.*
4. Relaunch **HyperDisk** to apply the configuration.

You're done! HyperDisk will now run at maximum scan speed, analyze all directories seamlessly, and will never ask you for access permissions again.

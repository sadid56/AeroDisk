#!/bin/bash
killall HyperDisk 2>/dev/null
rm -rf ~/Library/Application\ Support/com.hyperdisk
rm -rf ~/Library/Caches/com.hyperdisk
rm -rf ~/Library/WebKit/com.hyperdisk
rm -rf ~/Library/Saved\ Application\ State/com.hyperdisk.savedState
rm -f ~/Library/Preferences/com.hyperdisk.plist
tccutil reset All com.hyperdisk
echo All HyperDisk caches and permissions cleaned.

# run this this command -> sh clean.sh

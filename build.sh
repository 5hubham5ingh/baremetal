#!/bin/bash

PROJECT_ROOT=$(pwd)

echo "Creating zip the addon."
(
  cd "$PROJECT_ROOT/addon" || exit 1
  zip -r -FS "$PROJECT_ROOT/dist/addon.zip" *
) || {
  echo "Error: Failed to zip addon."
  exit 1 # Exit with error code
}

echo "Compiling native app"
qjsc -D "$PROJECT_ROOT/app/handleMessageWorker.js" -o baremetal "$PROJECT_ROOT/app/main.js" || {
  echo "Error: Failed to compile native app."
  exit 1
}

echo "Compressing native app for distribution"
tar -czvf "$PROJECT_ROOT/dist/baremetal-linux-86_64.tar.gz" baremetal || {
  echo "Error: Failed to create tar.gz archive."
  exit 1
}

echo "Installing native app system wide"
sudo mv baremetal /usr/bin/

echo "Generating default manifest.json for native app"
sudo baremetal

echo "Build process complete."

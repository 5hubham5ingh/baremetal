#!/bin/bash

PROJECT_ROOT=$(pwd)

echo "PROJECT_ROOT is set to: $PROJECT_ROOT"

[[ $EUID -eq 0 ]] && {
    echo "This script should not be run as root! Run it as a regular user." >&2
    exit 1
}

# Ensure directories exist
[[ -d "$PROJECT_ROOT/addon" ]] || { echo "Directory $PROJECT_ROOT/addon not found!"; exit 1; }
[[ -d "$PROJECT_ROOT/app" ]] || { echo "Directory $PROJECT_ROOT/app not found!"; exit 1; }


install_package() {
    local pkg_name="$1"
    
    echo "$pkg_name not found, installing..."
    
    if command -v sudo &>/dev/null; then
        SUDO="sudo"
    else
        SUDO=""
    fi

    if command -v pacman &>/dev/null; then
        $SUDO pacman -Sy --noconfirm "$pkg_name" && return
    elif command -v yay &>/dev/null; then
        yay -S --noconfirm "$pkg_name" && return
    elif command -v apt &>/dev/null; then
        $SUDO apt update && $SUDO apt install -y "$pkg_name" && return
    elif command -v dnf &>/dev/null; then
        $SUDO dnf install -y "$pkg_name" && return
    elif command -v zypper &>/dev/null; then
        $SUDO zypper install -y "$pkg_name" && return
    fi


    echo "Failed to install $pkg_name. Please install it manually."
    exit 1
}

# Check and install zip if not present
command -v zip &>/dev/null || install_package zip

# Check if qjsc is installed
if command -v qjsc &>/dev/null; then
    echo "qjsc is already installed. Skipping build."
else
    echo "qjsc not found, building from source..."

    # Ensure the directory does not already exist
    if [ -d "$PROJECT_ROOT/qjsc" ]; then
        echo "Warning: Destination path '$PROJECT_ROOT/qjsc' already exists. Deleting due to possible problems and rebuilding..."
        sudo rm -rf "$PROJECT_ROOT/qjsc" || { echo "Error: Failed to delete existing qjsc directory."; exit 1; }
    fi

    echo "Cloning qjsc repository..."
    git clone https://github.com/bellard/quickjs.git "$PROJECT_ROOT/qjsc" || { echo "Error: Failed to clone qjsc repository."; exit 1; }

    echo "Building qjsc from source..."
    (
        cd "$PROJECT_ROOT/qjsc" || exit 1
        sudo make install || { echo "Error: Failed to build."; exit 1; }
    ) || exit 1
fi

####################################################################################################################

# Fetch the required library if not present.
if [[ ! -d "qjs-ext-lib" ]]; then
    echo "Fetching qjs-ext-lib..."

    # Download and extract
    if curl -L -o app/out.zip https://github.com/ctn-malone/qjs-ext-lib/archive/refs/tags/0.12.4.zip; then
        unzip -d app app/out.zip && \
        mv app/qjs-ext-lib-0.12.4 qjs-ext-lib && \
        rm app/out.zip
    else
        echo "Error: Failed to fetch qjs-ext-lib."
        exit 1
    fi
else
    echo "qjs-ext-lib already exists, skipping download."
fi

echo "Creating zip of the addon."
mkdir -p "$PROJECT_ROOT/dist" || { echo "Error: Failed to create dist directory."; exit 1; }
(
    cd "$PROJECT_ROOT/addon" || exit 1
    zip -r -FS "$PROJECT_ROOT/dist/addon.zip" * || { echo "Error: Failed to zip addon."; exit 1; }
) || exit 1

echo "Compiling native app"
qjsc -flto -D "$PROJECT_ROOT/app/handleMessageWorker.js" -o baremetal "$PROJECT_ROOT/app/main.js" || {
    echo "Error: Failed to compile native app."
    exit 1
}

echo "Compressing native app for distribution"
tar -czvf "$PROJECT_ROOT/dist/baremetal-linux-86_64.tar.gz" baremetal || {
    echo "Error: Failed to create tar.gz archive."
    exit 1
}

# Remove existing binary if it exists
if [ -f "/usr/bin/baremetal" ]; then
    echo "Removing existing baremetal from /usr/bin/"
    sudo rm /usr/bin/baremetal || { echo "Error: Failed to remove existing baremetal."; exit 1; }
fi

echo "Installing native app system-wide"
sudo mv baremetal /usr/bin/ || {
    echo "Error: Failed to install baremetal."
    exit 1
}

echo "Generating default manifest.json for native app"
if sudo baremetal; then
    echo "Build process complete."
else
    echo "Error: Failed to execute native app."
    exit 1
fi

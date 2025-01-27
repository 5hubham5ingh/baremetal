
# Baremetal

A browser extension that enables users to create their own personalized new tab page and browser theme.

## Features:

* **Create your own new tab page:** Upload your `index.html`, `index.css`, `index.js`, and `background.js` files.
* **Set custom browser theme:** (Firefox only)
* **"Call" native JavaScript functions directly:** In your extension scripts to access system-level APIs.

## Setup:

* **Install:** Install the Baremetal browser extension/addon from your browser's extension marketplace.
* **Access:** Open the new tab page, and you'll be greeted with the extension's documentation.

### Native Function

* **Install:**
    * Download the native app from the GitHub releases page.
    * Run the following command to generate the `app_manifest.json`: 
        ```bash
        sudo baremetal
        ```
    * Move the binary to `/usr/bin`:
        ```bash
        sudo mv baremetal /usr/bin
        ```

* **Define Functions:**
    * Create or edit the file `~/.config/baremetal/main.js`.
    * Define your functions within this file and export them.

* **Call in Browser Scripts:**
    * Initialize the native functions in your browser scripts:
        ```javascript
        const [fun1, fun2] = NativeFunctions("fun1", "fun2"); 
        // or
        const [fun1, fun2] = new NativeFunctions("fun1", "fun2"); 
        ```



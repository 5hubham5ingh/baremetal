# Baremetal

A browser extension that empowers users to create highly customized new tab pages and browser themes.

## Features:

* **Unleash Creativity:** Design and implement your own unique new tab page using HTML, CSS, and JavaScript. Upload your `index.html`, `index.css`, `index.js`, and `background.js` files to bring your vision to life.
* **Enhanced Aesthetics:** (Firefox Only) Personalize your browser's visual appearance by setting custom themes.
* **Bridge the Gap:** Seamlessly "call" native JavaScript functions directly within your extension scripts to access powerful system-level APIs.

## Setup:

* **Installation:** 
    * Obtain the Baremetal browser extension/addon from your browser's official extension marketplace.
    * Install the extension to seamlessly integrate it into your browsing experience.
* **Access and Explore:** Open a new tab, and you'll be greeted with the extension's comprehensive documentation to guide you through its usage and features.

### Native Function Integration

Baremetal enables you to directly interact with native JavaScript functions defined within your system. This powerful feature unlocks access to advanced system-level APIs.

* **Installation and Configuration:**
    1. **Download:** Download the native app from the official GitHub releases page.
    2. **Generate Manifest:** Execute the following command in your terminal to generate the app's essential `manifest.json` file: 
        ```bash
        sudo baremetal
        ```
    3. **Install Globally:** Move the native app binary to the system's global binary directory:
        ```bash
        sudo mv baremetal /usr/bin
        ```

* **Define and Export Native Functions:**
    1. **Create or Edit:** Access and modify the `~/.config/baremetal/main.js` file.
    2. **Define Functions:** Within this file, meticulously define your desired native functions and ensure they are properly exported for use within your browser scripts.

* **Calling Native Functions in Browser Scripts:**
    1. **Initialization:** Integrate the following line into your browser scripts to initialize the necessary native functions:
        ```javascript
        const [fun1, fun2] = NativeFunctions("fun1", "fun2"); 
        ```
        * **Note:** Using `new NativeFunctions("fun1", "fun2")` creates a new instance of the native app, ideal for parallel execution. Without the `new` keyword, all function executions are queued sequentially, potentially causing delays for long-running operations.

* **Important Considerations:**
    * **Indirect Calling:** While you can import and reference native functions within your browser scripts, the actual execution happens through the native app. This ensures a secure and controlled environment.
    * **Data Serialization:** All arguments passed to native functions and any returned values must be serializable in JSON format for seamless data exchange.

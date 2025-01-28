
# Baremetal

A browser extension that empowers users to create highly customized new tab pages and browser themes.

## Features:

* **Unleash Your Creativity:** Design and implement your own unique new tab page using HTML, CSS, and JavaScript. Upload your `index.html`, `index.css`, `index.js`, and `background.js` files to bring your vision to life.
* **Enhanced Aesthetics (Firefox Only):** Personalize your browser's visual appearance by setting custom themes.
* **Native Functionality Integration:** Seamlessly interact with native JavaScript functions within your extension scripts, unlocking powerful system-level APIs.

---

## Setup

### **Installation:**

1. Download the Baremetal browser extension/add-on from your browser's official extension marketplace.
2. Install the extension to seamlessly integrate it into your browsing experience.

### **Access and Explore:**

- Open a new tab, where you’ll find comprehensive documentation to guide you through the extension’s usage and features.

---

## Creating a Custom New Tab Page

1. Prepare your new tab page files:
   - **index.html**: Contains the structure of your new tab page.
   - **index.css**: Handles the styles for your page.
   - **index.js**: Manages interactivity and functionality.
   - **background.js**: Contains scripts to execute in the background.

2. Upload your files:
   - Press `Ctrl + Enter` to open the upload interface.
   - Drag and drop your files or click to browse and upload them.

3. Execution order:
   - The **index.html**, **index.css**, and **index.js** files will execute in the specified order to create your custom new tab page.
   - The **background.js** file will run as the extension's background script and should only include code designed for background tasks.

---

## Native Function Integration

Baremetal allows you to directly interact with native JavaScript functions defined in your system, providing access to advanced system-level APIs.

### **Installation and Configuration:**

1. **Download the Native App:**  
   Get the native app from the official GitHub releases page.

2. **Generate the Manifest:**  
   Run the following command in your terminal to generate the app's `manifest.json` file:  
   ```bash
   sudo baremetal /path/to/binary
   ```

3. **Install Globally:**  
   Move the native app binary to your system’s global binary directory:  
   ```bash
   sudo mv baremetal /path/to/binary
   ```  
   By default, `/path/to/binary` is `/usr/bin`. For the default setup, run:  
   ```bash
   sudo baremetal
   sudo mv baremetal /usr/bin
   ```

---

### **Define and Export Native Functions:**

1. **Modify Configuration File:**  
   Open or create the `~/.config/baremetal/main.js` file.

2. **Define Native Functions:**  
   Add your desired native functions in this file, ensuring they are properly exported for use in browser scripts.

---

### **Calling Native Functions in Browser Scripts:**

1. **Initialization:**  
   Use the following syntax to initialize native functions in your browser scripts:  
   ```javascript
   const [fun1, fun2] = NativeFunctions("fun1", "fun2");
   // or
   const [fun1, fun2] = new NativeFunctions("fun1", "fun2"); 
   ```

   - **Note:** Using `new NativeFunctions("fun1", "fun2")` creates a new instance of the native app, ideal for parallel execution. Without the `new` keyword, all function executions are queued sequentially, which may introduce delays for long-running operations.

---

### **Important Considerations:**

1. **Execution Context:**  
   Native functions are executed via the native app, ensuring a secure and controlled environment.  

2. **Data Serialization:**  
   All arguments passed to native functions and any return values must be serializable in JSON format to ensure seamless data exchange.

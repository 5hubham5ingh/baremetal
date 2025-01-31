document.addEventListener("DOMContentLoaded", async () => {
  const files = await retrieveDataFromIndexedDB("files");
  if (files) {
    processFiles(files);
  } else {
    // load docs
    const createElement = (tag, text, style, props = {}) => {
      const el = Object.assign(document.createElement(tag), props);
      if (text) el.textContent = text;
      el.style.cssText = style;
      return el;
    };

    document.body.style.cssText =
      "display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;background:#282c34;color:#e0e0e0;font-family:sans-serif;margin:0";

    document.body.append(
      createElement(
        "h1",
        "Welcome to Baremetal Extension!",
        "font-size:2.2em;margin-bottom:8px;color:#61dafb;text-align:center"
      ),
      createElement(
        "p",
        "Press Ctrl+Enter to upload custom HTML, CSS, and JS.",
        "font-size:1.1em;max-width:600px;margin:8px 0;text-align:center"
      ),
      createElement(
        "p",
        "Or see the documentation to get started.",
        "font-size:1.1em;max-width:600px;margin:8px 0;text-align:center"
      ),
      createElement(
        "a",
        "Documentation",
        "color:#61dafb;text-decoration:none;padding:4px 8px;border-radius:4px;border:1px solid #61dafb;margin-top:8px;text-align:center",
        {
          href: "https://github.com/5hubham5ingh/baremetal/blob/main/README.md#baremetal",
        }
      )
    );
  }
});

// Listen for Ctrl+Enter to upload custom html, css, and js.
document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "Enter") {
    showModal();
  }
});

// Listen for custom html, css and js upload
document
  .getElementById("fileUpload")
  .addEventListener("change", handleFileUpload);

/*----------------- NativeFunctions helpers --------------------*/
let backgroundScriptPort;
const backgroundMessageHandlers = new Map();

function handleMessage(message, resolve, reject) {
  const { status, data } = message;
  status === 0 ? resolve(JSON.parse(data)) : reject(data);
}

function messageHandler(message) {
  const handler = backgroundMessageHandlers.get(message.id);
  if (!handler) console.error("No handler for: ", message.id);
  else handler(message);
}

function setupConnection() {
  if (!backgroundScriptPort) {
    backgroundScriptPort = browser.runtime.connect();
    backgroundScriptPort.onMessage.addListener(messageHandler);
  }
}

function createFunctionWrapper(functionName, id, usePort = true) {
  return function () {
    return new Promise((resolve, reject) => {
      const message = {
        functionName,
        arguments: Array.from(arguments),
        id,
      };

      const listener = (message) => handleMessage(message, resolve, reject);
      backgroundMessageHandlers.set(id, listener);

      if (usePort) {
        setupConnection();
        backgroundScriptPort.postMessage(message);
      } else {
        if (!browser.runtime.onMessage.hasListener(messageHandler)) {
          browser.runtime.onMessage.addListener(messageHandler);
        }
        browser.runtime.sendMessage(message);
      }
    });
  };
}
/*---------------------------------------------------------------*/

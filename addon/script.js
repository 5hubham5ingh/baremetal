document.addEventListener(
  "DOMContentLoaded",
  async () => {
    const files = await retrieveDataFromIndexedDB("files");
    if (files) {
      processFiles(files);
    } else { // load docs
      const iframe = document.createElement("iframe");
      iframe.src = "https://5hubham5ingh.github.io/baremetal";
      iframe.frameBorder = "0";
      iframe.style.height = "100vh";
      iframe.style.width = "100%";
      document.body.appendChild(iframe);
    }
  },
);

// Listen for Ctrl+Enter to upload custom html, css, and js.
document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "Enter") {
    showModal();
  }
});

// Listen for custom html, css and js upload
document.getElementById("fileUpload").addEventListener(
  "change",
  handleFileUpload,
);

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

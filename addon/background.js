browser.browserAction.onClicked.addListener(function (tab) {
  browser.tabs.create({
    url:
      "https://github.com/5hubham5ingh/baremetal/blob/main/README.md#baremetal",
    active: true,
  });
});

/*
 background script acts as a bridge between content script and native application
*/
const nativeAppName = "baremetal";
let nativeAppPort;
const dataChunks = [];
const nativeAppMessageHandlers = new Map();

let contentScriptPort;
const nativeAppMessageHandler = (message) => {
  const messageHandler = (message) => {
    const nativeAppMessageHandler = nativeAppMessageHandlers
      .get(message.id);

    if (nativeAppMessageHandler) {
      nativeAppMessageHandlers.delete(message.id);
      nativeAppMessageHandler(message);
    } else contentScriptPort?.postMessage(message);
  };

  switch (message.status) {
    case 0.5:
      // message.data is a chunk of data so accumulate them
      dataChunks.push(message.data);
      break;

    case 0: {
      // message.data is the final data
      dataChunks.push(message.data);
      const completeMessage = {
        ...message,
        data: dataChunks.join(""),
      };
      messageHandler(completeMessage);
      dataChunks.length = 0;
      break;
    }
    case 1: {
      // message.data is an error
      messageHandler(message);
    }
  }
};

const connectNativeApp = () => {
  if (nativeAppPort) return;
  nativeAppPort = browser.runtime.connectNative(nativeAppName);
  // listen for messages from native application
  nativeAppPort.onMessage.addListener(nativeAppMessageHandler);

  // listen for disconnection from native application
  nativeAppPort.onDisconnect.addListener((port) => {
    if (port.error) {
      console.error(`Disconnected due to an error: ${port.error}`);
    } else {
      console.log(`Disconnected`, port);
    }
  });
};

const contentScriptMessageHandler = (messageFromContentScript) => {
  // pass the message to native application
  connectNativeApp();

  nativeAppPort.postMessage(messageFromContentScript);
};

browser.runtime.onConnect.addListener((currentContentScriptPort) => {
  contentScriptPort = currentContentScriptPort; // set or update the script port
  contentScriptPort.onMessage.addListener(contentScriptMessageHandler);
});

browser.runtime.onMessage.addListener((message, sender) => {
  const dataChunks = [];
  browser.runtime.sendNativeMessage(nativeAppName, message).then((response) => {
    const currentBackgroundMessageHandler = nativeAppMessageHandlers
      .get(message?.messageId);

    const messageHandler = (msg) =>
      currentBackgroundMessageHandler
        ? currentBackgroundMessageHandler(msg)
        : browser.tabs.sendMessage(sender.tab.id, msg);

    switch (response.status) {
      case 0:
        messageHandler({
          status: 0,
          id: message.id,
          data: response.data,
        });
        dataChunks.length = 0;
        break;
      case 0.5:
        messageHandler({
          status: 1,
          id: message.id,
          data: "Message from native app exceded 1mb data transfer limit.",
        });
        break;
      case 1:
        messageHandler({
          status: 1,
          id: message.id,
          data: response.data,
        });
        break;
    }
  });
});

/*------------------ Native Functions API helpers implimentation for background script ------------------*/

function handleMessage(message, resolve, reject) {
  const { status, data } = message;
  status === 0 ? resolve(JSON.parse(data)) : reject(data);
}
// impliment createFunctionWrapper function for Native function API
function createFunctionWrapper(functionName, id, usePort = true) {
  return function () {
    return new Promise((resolve, reject) => {
      const message = {
        functionName,
        arguments: Array.from(arguments),
        id,
      };

      const listener = (message) => handleMessage(message, resolve, reject);

      if (usePort) {
        connectNativeApp();
        nativeAppMessageHandlers.set(id, listener);
        nativeAppPort.postMessage(message);
      } else {
        browser.runtime.sendNativeMessage(nativeAppName, message).then(
          listener,
        );
      }
    });
  };
}

/*------------------ Load user background.js ------------------*/
const [getBgScript, _, onChange] = SharedState("bgScript");

const injectBgScript = async (script) => {
  try {
    nativeAppMessageHandlers.clear(); // remove old handlers
    await (new Function(script))();
  } catch (error) {
    console.error("Failed to inject background.js.");
    throw error;
  }
};
getBgScript().then(async (script) => {
  if (script) await injectBgScript(script);
  onChange(injectBgScript);
});

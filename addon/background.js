console.log("background2.js");
/*
 background script acts as a bridge between content script and native application
*/
let nativeAppPort;
const dataChunks = [];
browser.runtime.onConnect.addListener((contentScriptPort) => {
  contentScriptPort.onMessage.addListener(async (message) => {
    // pass the message to native application
    if (!nativeAppPort) {
      nativeAppPort = browser.runtime.connectNative("baremetal");

      // listen for messages from native application
      nativeAppPort.onMessage.addListener(async (message) => {
        console.log("Message from native app:", message);
        switch (message.status) {
          case 0.5:
            // message.data is a chunk of data so accumulate them
            dataChunks.push(message.data);
            break;

          case 0:
            // message.data is the final data
            dataChunks.push(message.data);
            contentScriptPort.postMessage({
              status: 0,
              data: dataChunks.join(""),
            });
            dataChunks.length = 0;
            break;

          case 1:
            // message.data is an error
            contentScriptPort.postMessage({
              status: 1,
              data: message.data,
            });
        }
      });

      // listen for disconnection from native application
      nativeAppPort.onDisconnect.addListener((port) => {
        if (port.error) {
          console.error(`Disconnected due to an error: ${port.error}`);
        } else {
          console.log(`Disconnected`, port);
        }
      });
    }

    console.log(
      "Message from content script:",
      message,
      "\nSending to native app"
    );
    nativeAppPort.postMessage(message);
  });
});

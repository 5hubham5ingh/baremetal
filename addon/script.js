console.log("script2.js");
let backgroundScriptPort;

function NativeFunctions() {
  if (!(this instanceof NativeFunctions))
    // function was called without new
    return Object.values(arguments).map(
      (functionName) =>
        function () {
          return new Promise((resolve, reject) => {
            if (!backgroundScriptPort) {
              backgroundScriptPort = browser.runtime.connect();
            }

            const message = {
              data: {
                functionName,
                arguments: Object.values(arguments),
              },
            };
            backgroundScriptPort.postMessage(message);

            backgroundScriptPort.onMessage.addListener(async (message) => {
              console.log("Message from background script:", message);
              if (message.status === 0) {
                resolve(message.data);
              } else {
                reject(message.error);
              }
            });
          });
        }
    );
}

console.log("getting native functions");
const [getTheme, getWallpaper] = NativeFunctions("getTheme", "getWallpaper");

console.log("calling getTheme");
getTheme("theme")
  .then((theme) => {
    console.log(theme);
  })
  .catch((error) => console.error(error));

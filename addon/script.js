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
              functionName,
              arguments: Object.values(arguments),
            };
            backgroundScriptPort.postMessage(message);

            backgroundScriptPort.onMessage.addListener(async (message) => {
              if (message.status === 0) {
                resolve(message.data);
              } else {
                reject(message.data);
              }
            });
          });
        }
    );
}

const [getTheme, getWallpaper] = NativeFunctions("getTheme", "getWallpaper");

getTheme("theme")
  .then((theme) => {
    console.log(theme);
  })
  .catch((error) => console.error(error));

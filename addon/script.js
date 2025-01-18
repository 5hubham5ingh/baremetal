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
  else {
    const genId = () => crypto.getRandomValues(new Uint8Array(4)).join("");
    return Object.values(arguments).map((functionName) => {
      return function () {
        return new Promise((resolve, reject) => {
          const id = genId();
          const message = {
            functionName,
            arguments: Object.values(arguments),
            id,
          };
          const listener = (message) => {
            if (message.id === id) {
              if (message.status === 0) {
                resolve(message.data);
              } else {
                reject(message.data);
              }
              browser.runtime.onMessage.removeListener(listener);
            }
          };
          browser.runtime.onMessage.addListener(listener);
          browser.runtime.sendMessage(message);
        });
      };
    });
  }
}

const [getTheme, getWallpaper] = new NativeFunctions(
  "getTheme",
  "getWallpaper"
);

getTheme("theme")
  .then((theme) => {
    console.log(theme);
  })
  .catch((error) => console.error(error));

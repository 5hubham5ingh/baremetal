import { exit, getenv, in as stdin, open, out as stdout } from "std";
import { isatty, exec } from "os";

generateAppManifest();

/* Main loop */
while (true) {
  try {
    const message = getMessage();
    await handleMessage(message);
  } catch (error) {
    sendError(error);
  }
}

/**************************** Helpers *****************************/

async function handleMessage(message) {
  let extension;
  const extensionPath = getenv("HOME").concat("/.config/baremetal/main.js");
  try {
    extension = await import(extensionPath);
  } catch {
    throw Error("Failed to import extension at " + extensionPath);
  }
  const result = await extension[message.functionName]();
  sendMessage("Message from native app: " + JSON.stringify(result));
}

// Read a message from stdin using the length-prefixed header
function getMessage() {
  const rawLength = new Uint8Array(4);
  const bytesRead = stdin.read(rawLength.buffer, 0, 4); // Read the 4-byte header
  if (bytesRead !== 4) {
    throw Error("invalid header length: " + bytesRead);
  }
  const messageLength = new DataView(rawLength.buffer).getUint32(0, true); // Little-endian
  return JSON.parse(stdin.readAsString(messageLength));
}

// Send an encoded message to stdout
function sendMessageChunk(messageString) {
  const message = JSON.stringify(messageString);
  const encodedLength = new Uint8Array(4);
  new DataView(encodedLength.buffer).setUint32(0, message.length, true);
  stdout.write(encodedLength.buffer, 0, 4); // Write the 4-byte length header
  stdout.puts(message);
  stdout.flush();
}

function sendMessage(result) {
  const message = JSON.stringify(result);

  const chunkSize = 1000000;

  if (message.length > chunkSize) {
    // Split message into chunks
    const chunks = message.match(new RegExp(`.{1,${chunkSize}}`, "g"));

    // Send each chunk with appropriate status
    chunks.forEach((chunk, index) => {
      const status = index === chunks.length - 1 ? 0 : 0.5;
      sendMessageChunk({ status, data: chunk });
    });
  } else {
    // Send the full message if it's within the size limit
    sendMessageChunk({ status: 0, data: message });
  }
}

function sendError(error) {
  sendMessage({
    status: 1,
    data: `${error.constructor.name}: ${error.message}\n${error.stack}`,
  });
}

function generateAppManifest() {
  if (isatty()) {
    const nativeAppJson = {
      name: "baremetal",
      description: "Native app manifest for firefox.",
      path: scriptArgs[1] ?? "/usr/bin/baremetal",
      type: "stdio",
      allowed_extensions: ["baremetal@Fox"],
    };
    const nativeAppManifestDir = "/usr/lib/mozilla/native-messaging-hosts/";
    const nativeAppManifestFilePath = nativeAppManifestDir + "baremetal.json";

    exec(["mkdir", "-p", nativeAppManifestDir]);
    const nativeAppManifest = open(nativeAppManifestFilePath, "w+");

    if (!nativeAppManifest) {
      print(
        '  Failed to open native app manifest "' +
          nativeAppManifestFilePath +
          `".\n  Run 'sudo touch "${nativeAppManifestFilePath}" && baremetal' to generate the app manifest.`
      );
      exit(1);
    }

    nativeAppManifest.puts(JSON.stringify(nativeAppJson, null, 2));
    nativeAppManifest.close();
    exit(0);
  }
}

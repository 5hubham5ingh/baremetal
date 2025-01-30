import {
  err as stderr,
  exit,
  getenv,
  in as stdin,
  open,
  out as stdout,
} from "std";
import { exec, isatty, Worker } from "os";
import { exec as execAsync } from "../../qjs-ext-lib/src/process.js";

globalThis.execAsync = execAsync;

let extensionPath;
try {
  generateAppManifest();

  const worker = new Worker("./handleMessageWorker.js");
  extensionPath = getenv("HOME").concat("/.config/baremetal/main.js");

  /* Main loop */
  while (true) {
    const message = getMessage();
    // await handleMessage(message);
    worker.postMessage(message)
  }
} catch (error) {
  stderr.puts(`${error.constructor.name}: ${error.message}\n${error.stack}`);
}

/**************************** Helpers *****************************/

let extension;
async function handleMessage(message) {
  try {
    try {
    if(!extension)
      extension = await import(extensionPath);
    } catch {
      throw Error("Failed to import extension at " + extensionPath);
    }
    const result = await extension[message.functionName](...message.arguments);
    sendMessage(result, message.id);
  } catch (error) {
    sendError(error, message.id);
  }
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

function sendMessage(result, id) {
  const message = JSON.stringify(result);

  const chunkSize = 1000000;

  if (message.length > chunkSize) {
    // Split message into chunks
    const chunks = message.match(new RegExp(`.{1,${chunkSize}}`, "g"));

    // Send each chunk with appropriate status
    chunks.forEach((dataChunk, index) => {
      const status = index === chunks.length - 1 ? 0 : 0.5;
      const chunk = { status, data: dataChunk };
      if (status === 0) chunk.id = id;
      sendMessageChunk(chunk);
    });
  } else {
    // Send the full message if it's within the size limit
    const chunk = { status: 0, data: message, id };
    sendMessageChunk(chunk);
  }
}

function sendError(error, id) {
  sendMessageChunk({
    status: 1,
    id,
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
          `".\n  Run 'sudo baremetal' to generate the app manifest.`,
      );
      exit(1);
    }

    nativeAppManifest.puts(JSON.stringify(nativeAppJson, null, 2));
    nativeAppManifest.close();
    exit(0);
  }
}

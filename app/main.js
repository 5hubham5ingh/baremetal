import { err as stderr, exit, in as stdin, open } from "std";
import { exec, isatty, Worker } from "os";

try {
  generateAppManifest();

  const worker = new Worker("./handleMessageWorker.js");

  /* Main loop */
  while (true) {
    const message = getMessage();
    worker.postMessage(message);
  }
} catch (error) {
  stderr.puts(`${error.constructor.name}: ${error.message}\n${error.stack}`);
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

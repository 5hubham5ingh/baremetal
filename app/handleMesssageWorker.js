import {getenv, out as stdout } from "std";
import { Worker } from "os";

import { exec as execAsync } from "../../qjs-ext-lib/src/process.js";

globalThis.execAsync = execAsync;

Worker.parent.onmessage = (e) => handleMessage(e.data);

const extensionPath = getenv("HOME").concat("/.config/baremetal/main.js");
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



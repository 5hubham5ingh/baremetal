const dbName = "myDatabase";
const storeName = "myStore";

function retrieveDataFromIndexedDB(data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = (event) => {
      reject("Error opening database: " + event.target.errorCode);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(storeName, "readonly");
      const objectStore = transaction.objectStore(storeName);
      const getRequest = objectStore.get(data);

      getRequest.onsuccess = (event) => {
        resolve(event.target.result); // Resolve with the retrieved data (or undefined if not found)
      };

      getRequest.onerror = (event) => {
        reject("Error retrieving data: " + event.target.errorCode);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
}

function storeDataInIndexedDB(name, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1); // Version 1 of the database

    request.onerror = (event) => {
      reject("Error opening database: " + event.target.errorCode);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName); // Create the object store if it doesn't exist
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(storeName, "readwrite");
      const objectStore = transaction.objectStore(storeName);

      const putRequest = objectStore.put(data, name); // "data" is the key. overwrites if the key already exists

      putRequest.onsuccess = () => {
        resolve();
      };

      putRequest.onerror = (event) => {
        reject("Error storing data: " + event.target.errorCode);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    };
  });
}

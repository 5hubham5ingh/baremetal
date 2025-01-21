// Constants and configuration
const DB_CONFIG = {
  name: "baremetal",
  version: 1,
  store: "store",
};

// Database connection manager
class IndexedDBManager {
  constructor(config) {
    this.config = config;
    this.db = null;
    this.connecting = null;
  }

  // Get or create database connection
  async getConnection() {
    if (this.db) return this.db;

    // Reuse pending connection promise if exists
    if (this.connecting) return this.connecting;

    this.connecting = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => {
        const error = new Error(`Failed to open database: ${request.error}`);
        this.connecting = null;
        reject(error);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.config.store)) {
          db.createObjectStore(this.config.store);
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;

        // Handle connection losses
        this.db.onclose = () => {
          this.db = null;
        };
        this.db.onerror = () => {
          this.db = null;
        };

        this.connecting = null;
        resolve(this.db);
      };
    });

    return this.connecting;
  }

  // Close the connection
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Create singleton instance
const dbManager = new IndexedDBManager(DB_CONFIG);

// Helper function for database operations
async function executeTransaction(storeName, mode, callback) {
  const db = await dbManager.getConnection();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(new Error(`Transaction failed: ${transaction.error}`));

    callback(store, resolve, reject);
  });
}

// Main API functions
async function retrieveDataFromIndexedDB(key) {
  try {
    let result;
    await executeTransaction(
      DB_CONFIG.store,
      "readonly",
      (store, resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          result = request.result;
          resolve();
        };
        request.onerror = () =>
          reject(new Error(`Failed to retrieve data: ${request.error}`));
      },
    );
    return result;
  } catch (error) {
    console.error("Error in retrieveDataFromIndexedDB:", error);
    throw error;
  }
}

async function storeDataInIndexedDB(key, data) {
  try {
    await executeTransaction(
      DB_CONFIG.store,
      "readwrite",
      (store, resolve, reject) => {
        const request = store.put(data, key);
        request.onerror = () =>
          reject(new Error(`Failed to store data: ${request.error}`));
      },
    );
  } catch (error) {
    console.error("Error in storeDataInIndexedDB:", error);
    throw error;
  }
}

// Cleanup function for when you're done with the database
function cleanup() {
  dbManager.close();
}

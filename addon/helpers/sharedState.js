/**
 * Creates a shared state mechanism between background and content scripts
 * @param {string} stateName - Unique identifier for the shared state
 * @returns {[Function, Function]} - Returns [setState, onChange] functions
 */
const SharedState = (stateName) => {
  // Helper to toggle storage signal value
  const toggleSignal = async () => {
    const result = await browser.storage.local.get(stateName);
    const currentValue = result[stateName] || 0;
    await browser.storage.local.set({
      [stateName]: currentValue === 1 ? 0 : 1,
    });
  };

  /**
   * Updates the shared state value
   * @param {Object|Function} valueOrUpdater - New value or updater function
   * @returns {Promise<void>}
   */
  const setState = async (valueOrUpdater) => {
    try {
      let newValue;

      if (typeof valueOrUpdater === "function") {
        // Handle updater function case
        const currentValue = await retrieveDataFromIndexedDB(stateName);
        newValue = await (async () => {
          try {
            return await valueOrUpdater(currentValue);
          } catch (error) {
            // If valueOrUpdater throws, assume it's not async and try direct call
            return valueOrUpdater(currentValue);
          }
        })();
      } else {
        // Handle direct value update
        newValue = valueOrUpdater;
      }

      if (newValue instanceof Promise) {
        throw new Error("setState cannot store Promise objects");
      }

      await storeDataInIndexedDB(stateName, newValue);
      await toggleSignal();
    } catch (error) {
      console.error("SharedState setState error:", error);
      throw error;
    }
  };

  /**
   * Subscribes to state changes
   * @param {Function} callback - Function to call when state changes
   * @returns {Function} - Cleanup function to remove the listener
   */
  const onChange = async (callback) => {
    const handleStorageChange = async (changes, areaName) => {
      if (areaName === "local" && changes[stateName]) {
        const newValue = await retrieveDataFromIndexedDB(stateName);
        await callback(newValue);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);

    // Return cleanup function
    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  };

  return [() => retrieveDataFromIndexedDB(stateName), setState, onChange];
};

// Longdo Map utility functions

// TypeScript declaration for Longdo Maps
declare global {
  interface Window {
    longdo: {
      Map: any;
      Marker: any;
      Circle: any;
      Overlays: any;
      Layers: any;
    };
  }
}

// Wait for Longdo Map to load
export const waitForLongdo = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.longdo) {
      console.log("✅ Longdo Map already loaded");
      resolve();
      return;
    }

    console.log("⏳ Waiting for Longdo Map to load...");
    let attempts = 0;
    const maxAttempts = 300; // 30 seconds (100ms * 300)

    const checkInterval = setInterval(() => {
      attempts++;

      if (typeof window !== "undefined" && window.longdo) {
        clearInterval(checkInterval);
        console.log(
          `✅ Longdo Map loaded successfully after ${attempts * 100}ms`,
        );
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error("❌ Longdo Map failed to load after 30 seconds");
        reject(new Error("Longdo Map load timeout"));
      } else if (attempts % 10 === 0) {
        console.log(`⏳ Still waiting... (${attempts * 100}ms)`);
      }
    }, 100);
  });
};

// Check if Longdo is available
export const isLongdoAvailable = (): boolean => {
  return typeof window !== "undefined" && !!window.longdo;
};

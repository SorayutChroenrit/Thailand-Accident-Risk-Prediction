// Longdo Map utility functions

// Wait for Longdo Map to load
export const waitForLongdo = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).longdo) {
      resolve();
      return;
    }

    const checkInterval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).longdo) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      console.error('Longdo Map failed to load');
      resolve();
    }, 10000);
  });
};

// Check if Longdo is available
export const isLongdoAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).longdo;
};

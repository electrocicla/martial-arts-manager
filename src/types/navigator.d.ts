// Extended Navigator types for device performance detection
declare global {
  interface Navigator {
    deviceMemory?: number;
    connection?: NetworkInformation;
  }

  interface NetworkInformation {
    effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  }
}

export {};
export {};

declare global {
  interface Window {
    backendAPI: {
      // 🔑 Activation
      audit: (payload: any) => Promise<any>;
      dashboard: (payload: any) => Promise<any>;
      activation: (payload: any) => Promise<any>;
      attendance: (payload: any) => Promise<any>;
      deduction: (payload: any) => Promise<any>;
      employee: (payload: any) => Promise<any>;
      overtime: (payload: any) => Promise<any>;
      payrollPeriod: (payload: any) => Promise<any>;
      payrollRecord: (payload: any) => Promise<any>;
      
      // Events
      onActivationCompleted: (callback: (data: any) => void) => void;
      onActivationDeactivated: (callback: () => void) => void;
      onLicenseSynced: (callback: (data: any) => void) => void;
      // ⚙️ SYSTEM CONFIG API
      systemConfig: (payload: { method: string; params?: any }) => Promise<{
        status: boolean;
        message: string;
        data: any;
      }>;
      // 🪟 Window controls
      windowControl?: (payload: {
        method: string;
        params?: Record<string, any>;
      }) => Promise<{
        status: boolean;
        message: string;
        data?: any;
      }>;
      onWindowMaximized?: (callback: () => void) => void;
      onWindowRestored?: (callback: () => void) => void;
      onWindowMinimized?: (callback: () => void) => void;
      onWindowClosed?: (callback: () => void) => void;
      onWindowResized?: (callback: (bounds: any) => void) => void;
      onWindowMoved?: (callback: (position: any) => void) => void;

      // Other utilities
      showAbout: () => Promise<any>;

      // Setup specific
      skipSetup: () => Promise<any>;

      // Listeners
      onSetupComplete: (payload: any) => Promise<any>;

      // Database
      getSetupStatus: () => Promise<any>;

      // 🛠️ Logging
      log: {
        info: (message: string, data?: any) => void;
        error: (message: string, error?: any) => void;
        warn: (message: string, warning?: any) => void;
      };
    };
  }
}

// preload.js placeholder
// preload.js placeholder
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("backendAPI", {
  dashboard: (payload) => ipcRenderer.invoke("dashboard", payload),
  audit: (payload) => ipcRenderer.invoke("audit", payload),
  activation: (payload) => ipcRenderer.invoke("activation", payload),
  attendance: (payload) => ipcRenderer.invoke("attendance", payload),
  deduction: (payload) => ipcRenderer.invoke("deduction", payload),
  employee: (payload) => ipcRenderer.invoke("employee", payload),
  overtime: (payload) => ipcRenderer.invoke("overtime", payload),
  payrollPeriod: (payload) => ipcRenderer.invoke("payrollPeriod", payload),
  payrollRecord: (payload) => ipcRenderer.invoke("payrollRecord", payload),
  // 🪟 Window controls
  windowControl: (payload) => ipcRenderer.invoke("window-control", payload),
  systemConfig: (payload) => ipcRenderer.invoke("systemConfig", payload),

  // 👤 User & Auth
  user: (payload) => ipcRenderer.invoke("user", payload),
  // 📂 File System
  fs: (payload) => ipcRenderer.invoke("fs", payload),

  // 🎯 Event listeners
  onAppReady: (callback) => {
    ipcRenderer.on("app-ready", callback);
    return () => ipcRenderer.removeListener("app-ready", callback);
  },
  on: (event, callback) => {
    ipcRenderer.on(event, callback);
    return () => ipcRenderer.removeListener(event, callback);
  },

  minimizeApp: () => ipcRenderer.send("window-minimize"),
  maximizeApp: () => ipcRenderer.send("window-maximize"),
  closeApp: () => ipcRenderer.send("window-close"),
  quitApp: () => ipcRenderer.send("app-quit"),

  // Other utilities
  showAbout: () => ipcRenderer.send("show-about"),

  // Setup specific
  skipSetup: () => ipcRenderer.send("skip-setup"),

  // Listeners
  onSetupComplete: (callback) => ipcRenderer.on("setup-complete", callback),

  // Database
  getSetupStatus: () => ipcRenderer.invoke("get-setup-status"),

  // 🛠️ Logging
  log: {
    info: (message, data) => console.log("[Renderer]", message, data),
    error: (message, error) => console.error("[Renderer]", message, error),
    warn: (message, warning) => console.warn("[Renderer]", message, warning),
  },
});

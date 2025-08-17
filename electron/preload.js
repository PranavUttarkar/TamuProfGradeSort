const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  scrape: async (dept, number) => {
    const res = await ipcRenderer.invoke("scrape", { dept, number });
    if (!res.ok) throw new Error(res.error);
    return res.data;
  },
});

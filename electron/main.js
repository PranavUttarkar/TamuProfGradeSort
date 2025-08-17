const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const scrapeCourse = require("../app/scrapeCourse");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  win.once("ready-to-show", () => win.show());

  win.loadFile(path.join(__dirname, "../app/index.html"));
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("scrape", async (_event, { dept, number }) => {
  try {
    const data = await scrapeCourse(dept, number);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

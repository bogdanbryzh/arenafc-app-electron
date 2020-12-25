// Modules to control application life and create native browser window
const { app, BrowserWindow, globalShortcut } = require('electron')

let mainWindow

const createWindow = () => {
  mainWindow = new BrowserWindow({
    kiosk: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      spellcheck: false
    },
  })

  mainWindow.loadFile('public/index.html')

  globalShortcut.register('F5', () => {
    mainWindow.reload()
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
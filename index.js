// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
} = require('electron')

let mainWindow

const createWindow = () => {
  mainWindow = new BrowserWindow({
    kiosk: true,
    frame: false,
    icon: __dirname + '/public/img/icon.png',
    webPreferences: {
      nodeIntegration: true,
      spellcheck: false
    },
  })

  mainWindow.loadFile('public/index.html')
  // mainWindow.webContents.openDevTools()

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

ipcMain.on('select-dirs', async (event, arg) => {
  console.log('selecting directory')
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  })
  console.log('directories selected', result.filePaths)
  mainWindow.webContents.send('selected-dir', result.filePaths)
})

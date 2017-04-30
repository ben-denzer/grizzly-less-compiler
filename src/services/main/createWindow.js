// Electron
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow

// Node
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({ width: 800, height: 600 });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '../../../index.html'),
        protocol: 'file:',
        slashes: true,
    }));

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

module.exports = createWindow;
module.exports.mainWindow = mainWindow;

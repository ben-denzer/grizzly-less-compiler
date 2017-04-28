const electron = require('electron');
const ipcMain = require('electron').ipcMain;
const less = require('less');
const watch = require('node-watch');
const exec = require('child_process').exec;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow
const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({ width: 800, height: 600 });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
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

app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

let watcher = watch([], () => {});

const watchFiles = {
    add: function(file) {
        watcher.close();
        watchFiles.files = [...watchFiles.files, file];
    },
    remove: function(file) {
        watcher.close();
        const index = watchFiles.files.indexOf(file);
        if (index >= 0) {
            watchFiles.files = [
                ...watchFiles.files.slice(0, index),
                ...watchFiles.files.slice(index + 1),
            ];
        }
    },
    files: [],
}

const compileLess = (file, cb) => {
    const fullPath = file.slice(0, file.lastIndexOf('/') + 1);
    const fileName = file.slice(file.lastIndexOf('/') + 1, file.lastIndexOf('.'));
    const outputPath = path.join(path.normalize(`${fullPath}`), `${fileName}.css`);
    watcher = watch(watchFiles.files, (e, filename) => {
        if (e === 'update') {
            compileLess(filename, cb);
        }
    });

    exec(`lessc "${file}" --autoprefix="last 4 versions" ${outputPath}`, (error, stdout, stderr) => {
        if (error) {
            mainWindow.focus();
            cb({ output: error.toString(), file });
        }
        else if (stdout) {
            mainWindow.focus();
            cb({ output: stdout.toString(), file });
        }
        else if (stderr) {
            mainWindow.focus();
            cb({ output: stderr.toString(), file });
        }
        else {
            cb({ output: "success", file });
        }
    });
};

ipcMain.on('file added', (cb, file) => {
    watchFiles.add(file);
    compileLess(file, (res) => {
        cb.sender.send('watching', res);
    });
});

ipcMain.on('file removed', (cb, file) => {
    watchFiles.remove(file);
    watcher.close();
    cb.sender.send('removed');
    if (watchFiles.files.length > 0) {
        compileLess(watchFiles.files[0], (res) => {
            cb.sender.send('watching', res);
        });
    }
});

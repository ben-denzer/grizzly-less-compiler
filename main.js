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

let watchFiles = {
    add: function(file) {
        watchFiles.files.add(file);
    },
    get: function() {
        return [...watchFiles.files];
    },
    remove: function(file) {
        watchFiles.files.delete(file);
    },
    files: new Set(),
    outputPath: null,
}

const compileLess = (file = watchFiles.get()[0], cb) => {
    if (!file) return;
    const fullPath = file.slice(0, file.lastIndexOf('/') + 1).replace(' ', '\\ ');
    const fileName = file.slice(file.lastIndexOf('/') + 1, file.lastIndexOf('.'));
    const outputPath = watchFiles.outputPath || path.join(path.normalize(`${fullPath}`), `${fileName}.css`);
    watcher.close();
    watcher = watch(watchFiles.get(), (e, filename) => {
        if (e === 'update') {
            cb({ loading: true });
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
    compileLess(undefined, (res) => {
        cb.sender.send('watching', res);
    });
});

ipcMain.on('change output path', (event, file) => {
    watchFiles = Object.assign({}, watchFiles, { outputPath: file });
    event.sender.send('output path changed', file);
});

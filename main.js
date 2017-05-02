const electron = require('electron');
const ipcMain = require('electron').ipcMain;
const watch = require('node-watch');
const exec = require('child_process').exec;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow
const path = require('path');
const url = require('url');
const fs = require('fs');

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
    // mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', () => {
    createWindow();
    getInitialSettings();
});

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

const getInitialSettings = () => {
    fs.readFile(path.join(__dirname, 'settings', 'outputPath.txt'), 'utf8', (err, data) => {
        if (err || /^null/.test(data)) return;
        watchFiles.outputPath = data;
    });
};

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
    cb({ loading: true });
    const fullPath = file.slice(0, file.lastIndexOf('/') + 1).replace(' ', '\\ ');
    const fileName = file.slice(file.lastIndexOf('/') + 1, file.lastIndexOf('.'));
    const outputPath = watchFiles.outputPath || path.join(path.normalize(`${fullPath}`), `${fileName}.css`);
    watcher.close();
    watcher = watch(watchFiles.get(), (e, filename) => {
        console.log(e, filename);
        if (e === 'update') {
            cb({ loading: true });
            compileLess(filename, cb);
        }
    });
    watcher.on('error', err => console.log('error - ', err));
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

ipcMain.on('refresh', (cb, file) => {
    compileLess(file, (res) => {
        cb.sender.send('watching', res);
    });
});

ipcMain.on('change output path', (event, file) => {
    watchFiles = Object.assign({}, watchFiles, { outputPath: file });
    fs.writeFile(path.join(__dirname, 'settings', 'outputPath.txt'), file, (err, data) => { err && console.log(err)});
    event.sender.send('output path changed', file);
});

ipcMain.on('check initial settings', (e, file) => {
    if (watchFiles.outputPath && watchFiles.outputPath !== 'null') {
        e.sender.send('output path changed', watchFiles.outputPath);
    }
})

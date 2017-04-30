// Electron
const electron  = require('electron');
const ipcMain   = require('electron').ipcMain;
const app       = electron.app;

// Node
const watch     = require('node-watch');
const exec      = require('child_process').exec;
const path      = require('path');
const fs        = require('fs');

// Services
const createWindow  = require('./src/services/main/createWindow');
const mainWindow    = require('./src/services/main/createWindow').mainWindow;

app.on('ready', () => {
    createWindow();
    getInitialSettings();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
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
});

module.exports.mainWindow = mainWindow;

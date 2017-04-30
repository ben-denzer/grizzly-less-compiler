// Electron
const electron  = require('electron');
const app       = electron.app;
const ipcMain   = electron.ipcMain;

// Packages
const fs        = require('fs');
const path      = require('path');
const watch     = require('node-watch');

// Services
const serviceUrl            = './src/services/main';
const compileLess           = require(`${serviceUrl}/compileLess`);
const createWindow          = require(`${serviceUrl}/createWindow`);
const getInitialSettings    = require(`${serviceUrl}/getInitialSettings`);
const mainWindow            = createWindow.mainWindow;

// Data
const MainModel = require('./src/model/MainModel');
const model = new MainModel();

// App Setup
app.on('ready', () => {
    createWindow();
    // getInitialSettings();
});

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

let watcher = watch([], () => {});

ipcMain.on('file added', (cb, file) => {
    model.addFile(file);
    compileLess(file, model, watcher, (res) => {
        cb.sender.send('watching', res);
    });
});

ipcMain.on('file removed', (cb, file) => {
    model.removeFile(file);
    watcher.close();
    cb.sender.send('removed');
    compileLess(undefined, model, watcher, (res) => {
        cb.sender.send('watching', res);
    });
});

ipcMain.on('refresh', (cb, file) => {
    compileLess(file, model, watcher, (res) => {
        cb.sender.send('watching', res);
    });
});

ipcMain.on('change output path', (event, file) => {
    model.setOutputPath(file);
    event.sender.send('output path changed', file);
});

ipcMain.on('check initial settings', (e, file) => {
    return;
    // const outputPath = model.getOutputPath();
    // if (outputPath && outputPath !== 'null') {
    //     e.sender.send('output path changed', outputPath);
    // }
});

// Exports
module.exports.model = model;
module.exports.watcher = watcher;

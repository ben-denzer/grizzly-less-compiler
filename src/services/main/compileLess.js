const exec          = require('child_process').exec;
const mainWindow    = require('./createWindow').mainWindow;
const path          = require('path');
const watch         = require('node-watch');

function compileLess(file = model.getFiles()[0], model, watcher, cb) {
    if (!file) return;
    cb({ loading: true });

    const fullPath = file.slice(0, file.lastIndexOf('/') + 1).replace(' ', '\\ ');
    const fileName = file.slice(file.lastIndexOf('/') + 1, file.lastIndexOf('.'));
    const outputPath =
        model.getSettings().outputPath ||
        path.join(path.normalize(`${fullPath}`), `${fileName}.css`);

    watcher.close();
    watcher = watch(model.getFiles(), (e, filename) => {
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

module.exports = compileLess;

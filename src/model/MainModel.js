const saveState = require('../services/main/saveState');

class model {
    constructor() {
        this.state = {
            files: new Set(),
            settings: {
                outputPath: '',
            },
        };

        const methods = [
            'addFile',
            'getFiles',
            'getSettings',
            'setInitialSettings',
            'setOutputPath',
            'removeFile',
        ];
        methods.forEach(a => this[a] = this[a].bind(this));
    }
    addFile(file) {
        this.state.files.add(file);
        saveState(this.state);
    }
    getFiles() {
        return [...this.state.files];
    }
    getSettings() {
        return this.state.settings;
    }
    setInitialSettings(settings) {
        if (settings) {
            this.state = Object.assign({}, settings);
        }
    }
    setOutputPath(path) {
        const settings = Object.assign({}, this.state.settings, { outputPath: path });
        this.state = Object.assign({}, this.state, { settings });
        saveState(this.state);
    }
    removeFile(file) {
        this.state = Object.assign({}, this.state, { files: this.state.files.delete(file) });
        saveState(this.state);
    }
}

module.exports = model;

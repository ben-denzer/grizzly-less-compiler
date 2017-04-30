class model {
    constructor() {
        this.state = {
            files: new Set(),
            outputPath: '',
        };
        this.addFile        = this.addFile.bind(this);
        this.getFiles       = this.getFiles.bind(this);
        this.getOutputPath  = this.getOutputPath.bind(this);
        this.setOutputPath  = this.setOutputPath.bind(this);
        this.removeFile     = this.removeFile.bind(this);
    }
    addFile(file) {
        this.state = Object.assign({}, this.state, { files: this.state.files.add(file) });
    }
    getFiles() {
        return [...this.state.files];
    }
    getOutputPath() {
        return this.state.outputPath;
    }
    setOutputPath(path) {
        this.state = Object.assign({}, this.state, { outputPath: path });
        //     fs.writeFile(path.join(__dirname, 'settings', 'outputPath.txt'), file, (err, data) => { err && console.log(err)});

    }
    removeFile(file) {
        this.state = Object.assign({}, this.state, { files: this.state.files.delete(file) });
    }
}

module.exports = model;

const {ipcRenderer} = require('electron');
const ansiHtml = require('ansi-html');

const getId = (ID) => document.getElementById(ID);
let activeFiles = new Set();

function fileEventListener(e) {
    const myPath = getId('myFile').files[0].path.toString();
    if (!/.less/i.test(myPath.slice(-5))) {
        getId('outputContainer').innerText = "Thats Not A .less File";
        return;
    }
    ipcRenderer.send('file added', myPath);
}

function filterOutput(str) {
    if (/^success/.test(str)) {
        return str;
    }
    // remove the first section of the message - its not helpful
    let temp = str.slice(str.search(/\d\dm/) + 3);
    return ansiHtml(temp);
}

function makeStatusBox(fileName) {
    if (!fileName) return;

    const displayName = fileName.split(/[\\\/]/).slice(-2).join('/');

    return (
        `<div class="statusRow">
            <div class="statusRowLeft">
                <div class="removeButton" data-filename="${fileName}">X</div>
                <span class="statusBox">
                    ${displayName}
                 </span>
            </div>
            <div class="statusRowRight">
                <img class="refreshButton" data-filename="${fileName}" src="./img/refresh.ico" alt="compile">
            </div>
        </div>`
    );
}

function outputChangeListener() {
    const outputPath = getId('outputFile').files[0].path;
    ipcRenderer.send('change output path', outputPath);
}

function populateStatusContainer() {
    statusHtml = [...activeFiles].map(makeStatusBox).join(' ');
    toggleListenersOnButtons(); // removes listeners
    getId('statusContainer').innerHTML = statusHtml;
    toggleListenersOnButtons('add');
}

function resetOutputPath() {
    ipcRenderer.send('change output path', null);
}

function showLoading() {
    return `<img id="loading" src="./img/loading.gif" alt="loading">`;
}

function toggleListenersOnButtons(add) {
    const closeButtons = document.getElementsByClassName('removeButton');
    const closeButtonListener = (e) => {
        activeFiles.delete(e.target.dataset.filename);
        ipcRenderer.send('file removed', e.target.dataset.filename);
    };

    for (let i in closeButtons) {
        if (closeButtons.hasOwnProperty(i)) {
            if (add) {
                closeButtons[i].addEventListener('click', closeButtonListener);
            } else {
                closeButtons[i].removeEventListener('click', closeButtonListener);
            }
        }
    }

    const refreshButtons = document.getElementsByClassName('refreshButton');
    const refreshButtonListener = (e) => {
        ipcRenderer.send('refresh', e.target.dataset.filename);
    }

    for (let i in refreshButtons) {
        if (refreshButtons.hasOwnProperty(i)) {
            if (add) {
                refreshButtons[i].addEventListener('click', refreshButtonListener);
            } else {
                refreshButtons[i].removeEventListener('click', refreshButtonListener);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.send('check initial settings');
    getId('outputFile').addEventListener('change', outputChangeListener);
    getId('myFile').addEventListener('change', fileEventListener);
    getId('resetOutputPathButton').addEventListener('click', resetOutputPath);
});

ipcRenderer.on('watching', (event, res) => {
    outputContainer.innerHTML = res.loading ? showLoading() : filterOutput(res.output);
    activeFiles.add(res.file);
    populateStatusContainer();

    if (res.output && !/^success/.test(res.output)) {
        outputContainer.style.color = 'red';
    } else {
        outputContainer.style.color = 'green';
    }
});

ipcRenderer.on('removed', () => {
    populateStatusContainer();
    if (!activeFiles.length) getId('outputContainer').innerText = '';
});

ipcRenderer.on('output path changed', (event, res) => {
    if (!res || !res.length) {
        getId('resetOutputPathButton').style.display = 'none';
        getId('displayOutputPath').innerText = "Output path set to current folder";
    } else {
        getId('resetOutputPathButton').style.display = 'block';
        getId('displayOutputPath').innerText = res.split(/[\\\/]/).slice(-2).join('/');
    }
});

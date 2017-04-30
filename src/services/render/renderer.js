const {ipcRenderer} = require('electron');

const getId = (ID) => document.getElementById(ID);
let activeFiles = new Set();

function filterOutput(str) {
    if (/^success/.test(str)) {
        return str;
    }
    var temp = str.slice(str.search(/\d\dm/) + 3);
    temp = temp.split('').map(a => {
        return a.charCodeAt(0) > 126 || a.charCodeAt(0) < 32 ? ' ' : a
    }).join('');
    return temp.replace(/\d\dm/g, ' ');
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
                <img class="refreshButton" data-filename="${fileName}" src="./src/img/refresh.ico" alt="compile">
            </div>
        </div>`
    );
}

function populateStatusContainer() {
    statusHtml = [...activeFiles].map(makeStatusBox).join(' ');
    toggleListenersOnButtons(); // removes listeners
    getId('statusContainer').innerHTML = statusHtml;
    toggleListenersOnButtons('add');
}

function replaceFileInput() {
    // I was having a hell of a time removing the active status or
    // whatever its called on my file input - Stack Overflow said to
    // remove it and replace it
    const myFile = getId('myFile');
    if (myFile) {
        myFile.remove();
    }
    const newInput = document.createElement('input');
    newInput.type = 'file';
    newInput.id = 'myFile';
    newInput.addEventListener('change', () => {
        const myPath = newInput.files[0].path.toString();
        if (!/.less/i.test(myPath.slice(-5))) {
            getId('outputContainer').innerText = "Thats Not A .less File";
            replaceFileInput();
            return;
        }
        ipcRenderer.send('file added', myPath);
    });
    getId('inputContainer').appendChild(newInput);
}

function showLoading() {
    return `<img id="loading" src="./src/img/loading.gif" alt="loading">`;
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
    replaceFileInput();
    ipcRenderer.send('check initial settings');
    getId('outputFile').addEventListener('change', () => {
        const outputPath = getId('outputFile').files[0].path;
        ipcRenderer.send('change output path', outputPath);
    });
});

ipcRenderer.on('watching', (event, res) => {
    outputContainer.innerHTML = res.loading ? showLoading() : filterOutput(res.output);
    activeFiles.add(res.file);
    replaceFileInput();
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
    getId('displayOutputPath').innerText = res || "Output path set to current folder";

    const resetPath = () => { ipcRenderer.send('change output path', null) };

    if (res) {
        getId('resetOutputPathButton').style.display = 'block';
        getId('resetOutputPathButton').addEventListener('click', resetPath);
    } else {
        getId('resetOutputPathButton').style.display = 'none';
        getId('resetOutputPathButton').removeEventListener('click', resetPath);
    }
});

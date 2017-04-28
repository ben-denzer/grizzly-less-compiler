const {ipcRenderer} = require('electron');

const getId = (ID) => document.getElementById(ID);
let activeFiles = new Set();

function filterOutput(str) {
    var temp = str.slice(str.search(/\d\dm/) + 3);
    temp = temp.split('').map(a => {
        return a.charCodeAt(0) > 126 || a.charCodeAt(0) < 32 ? ' ' : a
    }).join('');
    return temp.replace(/\d\dm/g, ' ');
}

function makeStatusBox(fileName) {
    const displayName = fileName.split('/').slice(-2).join('/');

    return (
        `<div>
            <div class="removeButton" data-filename="${fileName}">X</div>
            <span class="statusBox">
                ${displayName}
            </span> - <span class="watching">
                Watching
            </span>
        </div>`
    );
}

function populateStatusContainer() {
    statusHtml = [...activeFiles].map(makeStatusBox).join(' ');
    toggleListenersOnCloseButtons();  // removes listeners
    getId('statusContainer').innerHTML = statusHtml;
    toggleListenersOnCloseButtons('add');
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
        ipcRenderer.send('file added', myPath);
    });
    getId('inputContainer').appendChild(newInput);
}

function toggleListenersOnCloseButtons(add) {
    const buttons = document.getElementsByClassName('removeButton');
    const buttonListener = (e) => {
        activeFiles.delete(e.target.dataset.filename);
        ipcRenderer.send('file removed', e.target.dataset.filename);
    };

    for (let i in buttons) {
        if (buttons.hasOwnProperty(i)) {
            if (add) {
                buttons[i].addEventListener('click', buttonListener);
            } else {
                buttons[i].removeEventListener('click', buttonListener);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    replaceFileInput();
});

ipcRenderer.on('watching', (event, res) => {
    outputContainer.innerHTML = filterOutput(res.output);
    activeFiles.add(res.file);
    replaceFileInput();
    populateStatusContainer();

    if (!/^success/.test(res.output)) {
        outputContainer.style.color = 'red';
    } else {
        outputContainer.style.color = 'green';
    }
});

ipcRenderer.on('removed', () => populateStatusContainer());

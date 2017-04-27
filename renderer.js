const {ipcRenderer} = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const myFile = document.getElementById('myFile');
    const statusBox = document.getElementById('statusBox');
    const statusContainer = document.getElementById('statusContainer');
    const outputContainer = document.getElementById('outputContainer');
    statusContainer.style.display = 'none';
    outputContainer.style.display = 'none';

    myFile.addEventListener('change', () => {
        ipcRenderer.send('file added', myFile.files[0].path);
    });

    ipcRenderer.on('watching', (event, res) => {
        myFile.style.display = 'none';
        statusContainer.style.display = 'block';
        outputContainer.style.display = 'block';
        outputContainer.innerHTML = res.output;

        if (!/success/.test(res.output)) {
            outputContainer.style.color = 'red';
        } else {
            outputContainer.style.color = 'green';
        }

        statusBox.innerText = res.displayName;
    });

    ipcRenderer.on('less error', () => console.log('less error'));
});

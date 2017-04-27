const {ipcRenderer} = require('electron');

const myFile = document.getElementById('myFile')
myFile.addEventListener('change', () => {
    console.log(myFile.files[0]);
    ipcRenderer.send('file added', myFile.files[0].path);
});

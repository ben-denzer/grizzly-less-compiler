const myFile = document.getElementById('myFile')
myFile.addEventListener('change', (e) => console.log(myFile.files[0]));

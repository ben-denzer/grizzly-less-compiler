const fs = require('fs');
const path = require('path');

function saveState(state) {
    console.log('in saveState', state);
    const data = JSON.stringify(Object.assign({}, state, { files: [...state.files] }));
    fs.writeFile(
        path.join(__dirname, '../../settings.txt'),
        data,
        () => {} // I don't know if the user needs to know that their settings didn't save
    );
}

module.exports = saveState;

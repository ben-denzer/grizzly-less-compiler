const fs    = require('fs');
const path  = require('path');

const getInitialSettings = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, '../../settings', 'outputPath.txt'), 'utf8', (err, data) => {
            if (err) reject(new Error('error getting settings'));
            resolve(JSON.parse(data));
        });
    });
};

module.exports = getInitialSettings;

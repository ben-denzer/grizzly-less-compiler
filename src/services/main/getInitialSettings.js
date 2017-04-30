const fs    = require('fs');
const path  = require('path');

const getInitialSettings = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, '../../settings.txt'), 'utf8', (err, data) => {
            if (err) reject(new Error('error getting settings'));
            console.log('in init', data);
            if (data) {
                const settings = Object.assign(
                    {},
                    JSON.parse(data),
                    { files: new Set(data.files) }
                );
                resolve(settings);
            } else {
                resolve('');
            }
        });
    });
};

module.exports = getInitialSettings;

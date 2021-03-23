const fs = require('fs');

module.exports = {
    getConfigValue(key) {
        jsonData = JSON.parse(fs.readFileSync("./config.json", "UTF-8"));
        return jsonData[key]
    },

    getAuthValue(key) {
        jsonData = JSON.parse(fs.readFileSync("./auth.json", "UTF-8"));
        return jsonData[key]
    }
}
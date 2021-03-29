const fs = require('fs');

module.exports = {
    getConfigValue(key) {
        jsonData = JSON.parse(fs.readFileSync("./config.json", "UTF-8"));
        return jsonData[key]
    },

    setConfigValue(key, value) {
        jsonData = JSON.parse(fs.readFileSync("./config.json", "UTF-8"));
        jsonData[key] = value
        fs.writeFileSync("./config.json", JSON.stringify(jsonData))
    },

    getAuthValue(key) {
        jsonData = JSON.parse(fs.readFileSync("./auth.json", "UTF-8"));
        return jsonData[key]
    }
}
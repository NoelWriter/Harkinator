const fs = require('fs');

module.exports = {
    getConfigValue(key) {
        try {
            jsonData = JSON.parse(fs.readFileSync("./config.json", "UTF-8"));
            return jsonData[key]
        } catch {
            return this.getConfigValue(key)
        }

    },

    setConfigValue(key, value) {
        try {
            jsonData = JSON.parse(fs.readFileSync("./config.json", "UTF-8"));
            jsonData[key] = value
            fs.writeFileSync("./config.json", JSON.stringify(jsonData))
        } catch {
            this.setConfigValue(key, value)
        }

    },

    getAuthValue(key) {
        try {
            jsonData = JSON.parse(fs.readFileSync("./auth.json", "UTF-8"));
            return jsonData[key]
        } catch {
            return this.getAuthValue(key)
        }

    }
}
const webdriver = require("selenium-webdriver");

module.exports = {
    start(URL = "https://capital.com/trading/platform/") {
        const driver = new webdriver.Builder()
            .forBrowser('firefox')
            .build()
        driver.get(URL)
        return driver
    }
}



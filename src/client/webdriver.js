const webdriver = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const config = require("../../config.json");
//const phantomjs = require("phantomjs")npm 

module.exports = {
    start(URL = "https://capital.com/trading/platform/") {
        if (config.HEADLESS) {
            const driver = new webdriver.Builder()
            .forBrowser('chrome')
            .setChromeOptions(new chrome.Options().addArguments("--lang=nl").headless())
            .build()
        driver.get(URL)
        return driver
        }
        else{
            const driver = new webdriver.Builder()
            .forBrowser('chrome')
            .setChromeOptions(new chrome.Options().addArguments("--lang=nl"))
            .build()
        driver.get(URL)
        return driver
        }

    }
}



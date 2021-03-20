const webdriver = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const config = require("../../config.json");
const firefox = require('selenium-webdriver/firefox')
const { Builder } = require('selenium-webdriver');
//const phantomjs = require("phantomjs")npm 

module.exports = {
    start(URL = "https://capital.com/trading/platform/") {
        if (config.HEADLESS) {
            var options = new firefox.Options();
            options.setPreference("intl.accept_languages", "nl,nl");
            options.addArguments("-headless");
            options.addArguments("start-maximized")
            options.addArguments("--disable-extensions")
            options.addArguments('--no-sandbox')
            options.addArguments('--disable-application-cache')
            options.addArguments('--disable-gpu')
            options.addArguments("--disable-dev-shm-usage")

            const driver = new Builder()
                .forBrowser('firefox')
                .setFirefoxOptions(options)
                .build();

            driver.get(URL)
        return driver
        } else {
            var options = new firefox.Options();
            options.setPreference("intl.accept_languages", "nl,nl");
            options.addArguments("start-maximized")
            options.addArguments("--disable-extensions")
            options.addArguments('--no-sandbox')
            options.addArguments('--disable-application-cache')
            options.addArguments('--disable-gpu')
            options.addArguments("--disable-dev-shm-usage")

            const driver = new webdriver.Builder()
                .forBrowser('firefox')
                .setFirefoxOptions(options)
                .build()
            driver.get(URL)
        return driver
        }

    }
}



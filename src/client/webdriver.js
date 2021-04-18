const webdriver = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');
const config = require('../utils/config');
const firefox = require('selenium-webdriver/firefox')
const { Builder } = require('selenium-webdriver');

module.exports = {
    start(URL = "https://capital.com/trading/platform/") {
        if (config.getConfigValue('HEADLESS')) {
            var options = new firefox.Options();
            options.setPreference("intl.accept_languages", "nl,NL");
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
            options.setPreference("intl.accept_languages", "nl,NL");
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



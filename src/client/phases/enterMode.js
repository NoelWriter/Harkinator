const chalk = require("chalk");
const {By, until} = require("selenium-webdriver");
const location = require("../../utils/locations")
const utils = require("../../utils/utils");

module.exports = {
    async execute(driver, isDemo = false, liveAccountNum = 1) {
        utils.log.generic(`Entering ${isDemo ? "Demo" : "Live"} modus`)
        await driver.wait(until.elementLocated(By.xpath(location.account_dropdown)), 10000).click()

        if (!isDemo)
            await driver.findElement(By.xpath(location.account_selector + `[${liveAccountNum}]/div`)).click()
        else {
            await driver.findElement(By.xpath(location.account_demoswitch)).click()
            await driver.findElement(By.xpath(location.account_selector + `[1]/div`)).click()
        }
    }
}
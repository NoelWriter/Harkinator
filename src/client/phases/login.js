const chalk = require("chalk");
const {By, until} = require("selenium-webdriver");
const location = require("../../utils/locations")
const utils = require("../../utils/utils");

module.exports = {
    async execute(driver, username, password) {
        utils.log.generic(`Logging in`)

        // Wait until chart is loaded
        await driver.sleep(4000)
        await driver.wait(until.elementLocated(By.xpath(location.login_modal)), 5000).click()
        await driver.findElement(By.xpath(location.username_field)).sendKeys(username)
        await driver.findElement(By.xpath(location.password_field)).sendKeys(password)
        await driver.wait(until.elementLocated(By.xpath(location.login_button)), 5000).click()
    }
}
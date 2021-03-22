const chalk = require("chalk");
const {By, until} = require("selenium-webdriver");
const location = require("../../utils/locations")
const utils = require("../../utils/utils");

module.exports = {
    async execute(driver, username, password, twoFactAuth = false) {
        utils.log.generic(`Logging in`)
        try {
            // Wait until chart is loaded
            await driver.sleep(4000)
            await driver.wait(until.elementLocated(By.xpath(location.login_modal)), 60000).click()
            await driver.findElement(By.xpath(location.username_field)).sendKeys(username)
            await driver.findElement(By.xpath(location.password_field)).sendKeys(password)
            await driver.wait(until.elementLocated(By.xpath(location.login_button)), 60000).click()

            // Wait 10 seconds till auth code is filled in if two factor authentication (2FA) is enabled
            if (twoFactAuth) {
                await driver.sleep(10000)
                await driver.wait(until.elementLocated(By.xpath(location.login_button_2fa)), 60000).click()
            }

            return true
        } catch (e) {
            return false
        }
        
    }
}
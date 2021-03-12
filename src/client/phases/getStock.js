const chalk = require("chalk");
const {By, until} = require("selenium-webdriver");
const location = require("../../utils/locations")
const utils = require("../../utils/utils");

module.exports = {
    async execute(driver, specifiedStock) {
        utils.log.generic(`Finding the specified stock: ${specifiedStock}`)
        const stockListElements = await driver.findElements(By.className("trade-instrument"))

        for (const stockListElementsKey of stockListElements) {
            const stockName = await stockListElementsKey.findElement(By.className("market")).getText()
            if (stockName === specifiedStock)
                return stockListElementsKey
        }

        utils.log.error(`${specifiedStock} not found.`)
        return false
    }
}
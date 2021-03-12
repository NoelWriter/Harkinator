const chalk = require("chalk");
const {By, until} = require("selenium-webdriver");
const location = require("../../utils/locations")
const utils = require("../../utils/utils");

module.exports = {
    async execute(driver, element, percentageAboveSell) {
        let priceArray = []

        while (priceArray.length < 10) {
            const sellPrice = await utils.getStockSellPrice(element)
            priceArray.push(sellPrice)
            await driver.sleep(100)
        }

        let total = 0;
        for (const priceArrayKey in priceArray) {
            total += priceArray[priceArrayKey];
        }
        const averageSellPrice = total / priceArray.length;
        const spread = await utils.getSpread(element)

        return averageSellPrice + (spread * percentageAboveSell)
    }
}
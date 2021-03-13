const chalk = require("chalk");
const {By, until} = require("selenium-webdriver");
const location = require("../../utils/locations")
const utils = require("../../utils/utils");

module.exports = {
    async buy(driver, element, percentageAboveSell) {
        let priceArray = []

        while (priceArray.length < 10) {
            const sellPrice = await utils.getStockSellPrice(element)
            priceArray.push(sellPrice)
            await driver.sleep(100)
        }

        let sum = 0
        for(let i = 0; i < priceArray.length; i++ ){
            sum += parseFloat(priceArray[i]) //don't forget to add the base
        }

        const avg = sum / priceArray.length;
        const spread = await utils.getSpread(element)

        return avg + (spread * percentageAboveSell)
    },

    async sell(driver, element, percentageProfit) {
        let positionPrice = await utils.getPositionHighestPrice(driver)
        const spread = await utils.getSpread(element)

        return positionPrice += spread * percentageProfit
    }
}
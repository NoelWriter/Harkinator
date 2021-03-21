const chalk = require("chalk");
const {By, until} = require("selenium-webdriver");
const location = require("../../utils/locations")
const utils = require("../../utils/utils");
const config = require("../../config/config.json")

module.exports = {
    async buy(driver, element, percentageAboveSell) {
        let priceArray = []
        let spreadArray = []

        while (priceArray.length < config.STOCK_AVERAGE_ITERATIONS) {
            await driver.sleep(config.STOCK_AVERAGE_TIME_DELAY)
            const sellPrice = await utils.getStockSellPrice(element)
            const spreadAmount = await utils.getSpread(element)
            priceArray.push(sellPrice)
            spreadArray.push(spreadAmount)
        }

        let sumPrice = 0
        for(let i = 0; i < priceArray.length; i++ ){
            sumPrice += parseFloat(priceArray[i])
        }

        let sumSpread = 0
        for(let i = 0; i < spreadArray.length; i++ ){
            sumSpread += parseFloat(priceArray[i])
        }

        const avgPrice = sumPrice / priceArray.length;
        const avgSpread = sumSpread / spreadArray.length;

        const curSpread = await utils.getSpread(element)
        const curStockSellPrice = await utils.getStockSellPrice(element)

        if (curSpread < avgSpread)
            if (curStockSellPrice < avgPrice)
                return curStockSellPrice + (curSpread * percentageAboveSell)
            else
                return avgPrice + (curSpread * percentageAboveSell)
        else
            if (curStockSellPrice < avgPrice)
                return curStockSellPrice + (avgSpread * percentageAboveSell)
            else
                return avgPrice + (avgSpread * percentageAboveSell)
    },

    async sell(driver, element, percentageProfit) {
        let positionPrice = await utils.getPositionHighestPrice(driver)
        const spread = await utils.getSpread(element)

        return positionPrice += spread * percentageProfit
    }
}
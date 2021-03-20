const chalk = require("chalk");
const {By, until} = require("selenium-webdriver");
const location = require("../../utils/locations")
const utils = require("../../utils/utils");

module.exports = {
    async buy(driver, element, percentageAboveSell) {
        let priceArray = []
        let spreadArray = []

        while (priceArray.length < 2) {
            await driver.sleep(100)
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

        const avgPrice = sumPrice / priceArray.length; // 3
        const avgSpread = sumSpread / spreadArray.length; // 1

        const curSpread = await utils.getSpread(element) // 1
        const curStockSellPrice = await utils.getStockSellPrice(element) // 2

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
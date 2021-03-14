const chalk = require("chalk");
const {By, until} = require("selenium-webdriver");
const location = require("../../utils/locations")
const utils = require("../../utils/utils");

module.exports = {
    async buy(driver, element, percentageAboveSell) {
        let priceArray = []
        let spreadArray = []

        while (priceArray.length < 30) {
            const sellPrice = await utils.getStockSellPrice(element)
            const spreadAmount = await utils.getStockSellPrice(element)
            priceArray.push(sellPrice)
            spreadArray.push(spreadAmount)
            await driver.sleep(100)
        }

        let sumPrice = 0
        for(let i = 0; i < priceArray.length; i++ ){
            sumPrice += parseFloat(priceArray[i]) //don't forget to add the base
        }

        let sumSpread = 0
        for(let i = 0; i < spreadArray.length; i++ ){
            sumSpread += parseFloat(priceArray[i]) //don't forget to add the base
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
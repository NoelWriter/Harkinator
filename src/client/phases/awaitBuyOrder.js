const {By, until, Key} = require("selenium-webdriver");
const location = require("../../utils/locations")
const config = require("../../../config.json");
const utils = require("../../utils/utils");

module.exports = {
    async execute(driver, stockElement, amount = 1, sellLevel) {
        utils.log.generic("Awaiting buy order fulfillment")

        while (await utils.getPositionsTotal(driver) <= 0) {
            await driver.sleep(500)

            if (await isDeltaTooHigh(stockElement, sellLevel)) {
                await utils.clearOpenOrders(driver)
                return false
            }
        }
        const boughtSellLevel = await utils.getStockSellPrice(stockElement)
        utils.log.generic("Order fulfilled")
        return boughtSellLevel
    }
}

async function isDeltaTooHigh(stockElement, sellLevel) {
    const spread = await utils.getSpread(stockElement)
    const upperLimitAmount = spread * config.STOCK_BUY_UPPER_LIMIT
    const lowerLimitAmount = spread * config.STOCK_BUY_LOWER_LIMIT
    const upperLimit = sellLevel + upperLimitAmount
    const lowerLimit = sellLevel - lowerLimitAmount

    const sellPrice = await utils.getStockSellPrice(stockElement)

    utils.log.debug(`${sellPrice} < ${lowerLimit} | ${sellPrice} > ${upperLimit}`)
    if (sellPrice < lowerLimit || sellPrice > upperLimit)
        return true
    else
        return false
}
const {By, until, Key} = require("selenium-webdriver");
const location = require("../../utils/locations")
const config = require("../../utils/config");
const utils = require("../../utils/utils");
const chalk = require("chalk");

module.exports = {
    async execute(driver, stockElement, amount = 1, sellLevel) {
        utils.log.generic("Awaiting buy order fulfillment")

        // Check for open short positions 
        if (await utils.getPositionsTotal(driver) < 0) {
            utils.log.warning('Short position detected!')
            await utils.clearOpenOrders(driver)
            return false
        }

        while (await utils.getPositionsTotal(driver) == 0) {

            if (await isDeltaTooHigh(stockElement, sellLevel)) {
                await utils.clearOpenOrders(driver)
                await driver.sleep(1000)
                
                if (await utils.getPositionsTotal(driver) <= 0)
                    return false
                
            }
        }

        if (await utils.getPositionsTotal(driver) !== config.getConfigValue('STOCK_AMOUNT')) {
            await driver.sleep(config.getConfigValue('STOCK_BUY_FILL_WAIT'))
        }
        
        
        const boughtSellLevel = await utils.getStockSellPrice(stockElement)
        utils.log.generic("Buy order fulfilled", chalk.greenBright)
        return boughtSellLevel
    }
}

async function isDeltaTooHigh(stockElement, sellLevel) {
    const spread = await utils.getSpread(stockElement)
    const upperLimitAmount = spread * config.getConfigValue('STOCK_BUY_UPPER_LIMIT')
    const lowerLimitAmount = spread * config.getConfigValue('STOCK_BUY_LOWER_LIMIT')
    const upperLimit = sellLevel + upperLimitAmount
    const lowerLimit = sellLevel - lowerLimitAmount

    const sellPrice = await utils.getStockSellPrice(stockElement)

    utils.log.debug(`${sellPrice} < ${lowerLimit} | ${sellPrice} > ${upperLimit}`)
    if (sellPrice < lowerLimit || sellPrice > upperLimit)
        return true
    else
        return false
}
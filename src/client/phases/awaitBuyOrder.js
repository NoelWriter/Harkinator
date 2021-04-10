const {By, until, Key} = require("selenium-webdriver");
const location = require("../../utils/locations")
const config = require("../../utils/config");
const utils = require("../../utils/utils");
const chalk = require("chalk");

module.exports = {
    async execute(driver, stockElement, amount = 1, sellLevel) {
        utils.log.generic("Awaiting buy order fulfillment")

        // Clear any open positions
        if (await utils.getPositionsTotal(driver) < 0) {
            utils.log.error("Short positions are open!")

            if (config.getConfigValue('FORCE_CLOSE_OPEN_POSITIONS'))
                await utils.clearOpenPosition(driver)
        }

        utils.log.generic("Checking if placed order is still at right price level")
        if (await isDeltaTooHigh(stockElement, sellLevel) && await utils.getPositionsTotal(driver) <= 0) {
            await utils.clearOpenOrders(driver)
            if (!await utils.getPositionsTotal(driver))
                return false
        }

        utils.log.generic("Awaiting position or order status")
        while (await utils.getPositionsTotal(driver) <= 0 && await utils.getOrdersTotal(driver) <= 0) {
            continue
        }

        utils.log.generic("Waiting for positions")
        while (await utils.getPositionsTotal(driver) <= 0) {
            if (await utils.checkPause(driver, true))
                return false

            if (await isDeltaTooHigh(stockElement, sellLevel)) {
                await utils.clearOpenOrders(driver)
                
                if (!await utils.getPositionsTotal(driver))
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
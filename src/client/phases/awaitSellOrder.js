const {By, until, Key} = require("selenium-webdriver");
const location = require("../../utils/locations")
const config = require("../../../config.json");
const utils = require("../../utils/utils");
const findPrice = require("./findPrice")

const modes = {
    LOSS: 0,
    NORMAL: 1,
    PROFIT: 2,
    BREAK_EVEN: 3
}

module.exports = {
    async execute(driver, stockElement, amount = 1, boughtSellLevel, curSellPrice, curSellPriceLevel) {
        utils.log.generic("Awaiting sell order fulfillment")

        while (await utils.getPositionsTotal(driver) > 0) {
            await driver.sleep(500)

            // On change of stock sell price
            if (!await isSellPriceDelta(driver, stockElement, curSellPriceLevel))
                continue

            switch (await getSellMode(driver, stockElement, boughtSellLevel)) {
                case modes.NORMAL:
                    return await findPrice.sell(driver, stockElement, config.STOCK_PROFIT)
                    break
                case modes.LOSS:
                    utils.log.warning(`Sell order is in loss mode`)
                    const spread = await utils.getSpread(stockElement)
                    let sellPrice = await utils.getStockSellPrice(stockElement)
                    return sellPrice += spread * config.STOCK_LOSS_MULTIPLIER
                case modes.PROFIT:
                    utils.log.generic(`Sell order is in profit mode`)
                    break
                case modes.BREAK_EVEN:
                    return
            }
        }
        utils.log.generic("Order fulfilled")

        if (await utils.getPositionsTotal(driver) < amount)
            await utils.clearOpenOrders(driver)

        return false
    }
}

async function getSellMode(driver, stockElement, boughtSellLevel) {
    const spread = await utils.getSpread(stockElement)
    const upperLimitAmount = spread * config.STOCK_SELL_UPPER_LIMIT
    const lowerLimitAmount = spread * config.STOCK_SELL_LOWER_LIMIT
    const upperLimit = boughtSellLevel + upperLimitAmount
    const lowerLimit = boughtSellLevel - lowerLimitAmount

    const sellPrice = await utils.getStockSellPrice(stockElement)

    utils.log.debug(`${sellPrice} < ${lowerLimit} | ${sellPrice} > ${upperLimit}`)
    if (sellPrice < lowerLimit)
        return modes.LOSS
    else if (sellPrice > upperLimit)
        return modes.PROFIT
    else
        return modes.NORMAL
}

async function isSellPriceDelta(driver, stockElement, curSellPriceLevel) {
    const curStockSellPrice = utils.getStockSellPrice(stockElement)

    const spread = await utils.getSpread(stockElement)
    const LimitAmount = spread * config.STOCK_EVALUATE_DELTA
    const upperLimit = curSellPriceLevel + LimitAmount
    const lowerLimit = curSellPriceLevel - LimitAmount

    return curStockSellPrice > upperLimit || curStockSellPrice < lowerLimit;
}
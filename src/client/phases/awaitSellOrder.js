const {By, until, Key} = require("selenium-webdriver");
const location = require("../../utils/locations")
const config = require("../../utils/config");
const utils = require("../../utils/utils");
const findPrice = require("./findPrice")

const modes = {
    LOSS: 0,
    NORMAL: 1,
    PROFIT: 2,
    BREAK_EVEN: 3
}

module.exports = {
    async execute(driver, stockElement, amount = 1, boughtSellLevel, curSellPriceLevel) {
        utils.log.generic("Awaiting sell order fulfillment")

        while (await utils.getPositionsTotal(driver) > 0) {
            await utils.checkPause(driver, true)

            // On change of stock sell price
            if (!await isSellPriceDelta(driver, stockElement, curSellPriceLevel))
                continue

            switch (await getSellMode(driver, stockElement, boughtSellLevel)) {
                case modes.NORMAL:
                    return await findPrice.sell(driver, stockElement, config.getConfigValue('STOCK_PROFIT'))
                case modes.LOSS:
                    utils.log.warning(`Sell order is in loss mode`)
                    const spread = await utils.getSpread(stockElement)
                    let sellPrice = await utils.getStockSellPrice(stockElement)
                    return sellPrice += spread * config.getConfigValue('STOCK_LOSS_MULTIPLIER')
                case modes.PROFIT:
                    utils.log.warning(`Sell order is in profit mode`)
                    return (await utils.getStockSellPrice(stockElement)) + (await utils.getSpread(stockElement) * 0.2)
                case modes.BREAK_EVEN:
                    utils.log.warning(`Sell order is in break even mode`)
                    return await findPrice.sell(driver, stockElement, 0)
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
    const upperLimitAmount = spread * config.getConfigValue('STOCK_SELL_UPPER_LIMIT')
    const lowerLimitAmountBreakEven = spread * config.getConfigValue('STOCK_SELL_LOWER_LIMIT_BREAK_EVEN')
    const lowerLimitAmountLoss = spread * config.getConfigValue('STOCK_SELL_LOWER_LIMIT_LOSS')
    const upperLimit = boughtSellLevel + upperLimitAmount
    const lowerLimitBreakEven = boughtSellLevel - lowerLimitAmountBreakEven
    const lowerLimitLoss = boughtSellLevel - lowerLimitAmountLoss

    const sellPrice = await utils.getStockSellPrice(stockElement)

    utils.log.debug(`${sellPrice} < ${lowerLimitBreakEven} | ${sellPrice} > ${upperLimit}`)
    if (sellPrice < lowerLimitBreakEven && sellPrice > lowerLimitLoss)
        return modes.BREAK_EVEN
    else if (sellPrice < lowerLimitLoss)
        return modes.LOSS
    else if (sellPrice > upperLimit)
        return modes.PROFIT
    else
        return modes.NORMAL
}

async function isSellPriceDelta(driver, stockElement, curSellPriceLevel) {
    const curStockSellPrice = await utils.getStockSellPrice(stockElement)

    const spread = await utils.getSpread(stockElement)
    const LimitAmountUp = spread * config.getConfigValue('STOCK_EVALUATE_DELTA_UP')
    const LimitAmountDown = spread * config.getConfigValue('STOCK_EVALUATE_DELTA_DOWN')
    const upperLimit = curSellPriceLevel + LimitAmountUp
    const lowerLimit = curSellPriceLevel - LimitAmountDown

    utils.log.debug(`${curStockSellPrice} < ${lowerLimit} | ${curStockSellPrice} > ${upperLimit}`)
    return curStockSellPrice > upperLimit || curStockSellPrice < lowerLimit;
}

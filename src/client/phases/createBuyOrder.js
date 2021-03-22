const {By, until, Key} = require("selenium-webdriver");
const location = require("../../utils/locations")
const config = require("../../../config.json");
const utils = require("../../utils/utils")

module.exports = {
    async execute(driver, stockElement, amount = 1, price, curSellLevel) {

        await stockElement.findElement(By.className("buy")).findElement(By.className("btn")).click()

        const amountString = amount.toFixed(config.STOCK_FRACTION_DIGITS).toString().replace('.', ',')
        if (config.STOCK_ROUND_TO_WHOLE)
            price = Math.round(price)

        const priceString = price.toFixed(config.STOCK_FRACTION_DIGITS).toString().replace('.', ',')

        await setAmount(stockElement, amountString)
        await setPrice(driver, stockElement, priceString)

        utils.log.generic(`Buying ${amountString} stocks with the price ${priceString}`)

        if (await utils.getPositionsTotal(driver) > 0) {
            utils.log.error("Position already filled detected")
            return false
        }

        if (await utils.getStockSellPrice(stockElement) < (curSellLevel - await utils.getSpread(stockElement) * config.FREEFALL_INDICATOR)) {
            utils.log.warning("Freefall detected")
            await driver.sleep(config.DELAY_FREEFALL_DETECTED)
            return false
        }
        
        await stockElement.findElement(By.xpath(location.buy_order_button)).click()

        while (!(await utils.getOrdersTotal(driver) > 0) && !(await utils.getPositionsTotal(driver) > 0)) {
            if (await isInvalidBalance(driver)) {
                await driver.sleep(10000)
                return false
            }
        }

        utils.log.generic(`Order placed successfully`)
        return utils.getStockSellPrice(stockElement)
    }
}

async function setAmount(stockElement, amountString) {
    const inputAmountElement = stockElement.findElement(By.xpath(location.buy_input_amount))
    await inputAmountElement.click()
    await inputAmountElement.sendKeys((utils.getOs() === 'MacOS' ? Key.COMMAND : Key.CONTROL), 'a')
    await inputAmountElement.sendKeys(amountString)
}

async function setPrice(driver, stockElement, priceString) {
    await stockElement.findElement(By.xpath(location.buy_input_price_toggle)).click()
    const inputPriceElement = stockElement.findElement(By.xpath(location.buy_input_price_amount))
    await inputPriceElement.click()
    await inputPriceElement.sendKeys((utils.getOs() === 'MacOS' ? Key.COMMAND : Key.CONTROL), 'a')
    await inputPriceElement.sendKeys(priceString)
}

async function isInvalidBalance(driver) {
    try {
        await driver.findElement(By.xpath(location.popup_close_button)).click()
        utils.log.warning("Account financing fullscreen error found")
        return true
    } catch (e) {
        
    }

    try {
        const popuptext = await driver.findElement(By.className("popover-notification__title")).getText()
        if (popuptext === "Order geweigerd") {
            utils.log.warning("Account financing error found")
            return true
        }
            return false
    } catch (e) {
        return false
    }
}
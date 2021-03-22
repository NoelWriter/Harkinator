const {By, until, Key} = require("selenium-webdriver");
const location = require("../../utils/locations")
const config = require("../../../config.json");
const utils = require("../../utils/utils");

module.exports = {
    async execute(driver, stockElement, amount = 1, price) {
        const amountString = amount.toFixed(config.STOCK_FRACTION_DIGITS).toString().replace('.', ',')

        if (config.STOCK_ROUND_TO_WHOLE)
            price = Math.round(price)

        const priceString = price.toFixed(config.STOCK_FRACTION_DIGITS).toString().replace('.', ',')

        utils.log.generic(`Selling ${amountString} stocks with the price ${priceString}`)
        await stockElement.findElement(By.className("sell")).findElement(By.className("btn")).click()

        await setAmount(stockElement, amountString)
        await setPrice(driver, stockElement, priceString)

        if (await utils.getPositionsTotal(driver) !== amount)
            return false

        try {
            await stockElement.findElement(By.xpath(location.buy_order_button)).click()
        }catch {
            return false
        }
        

        if (await isInvalidBalance(driver))
            return false

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
    await driver.sleep(50) // Time to let website finish animation
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

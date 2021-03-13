const {By, until, Key} = require("selenium-webdriver");
const location = require("../../utils/locations")
const config = require("../../../config.json");
const utils = require("../../utils/utils");

module.exports = {
    async execute(driver, stockElement, amount = 1, price) {
        const amountString = amount.toFixed(config.STOCK_FRACTION_DIGITS).toString().replace('.', ',')
        const priceString = price.toFixed(config.STOCK_FRACTION_DIGITS).toString().replace('.', ',')

        utils.log.generic(`Selling ${amountString} stocks with the price ${priceString}`)
        await stockElement.findElement(By.className("sell")).findElement(By.className("btn")).click()

        await setAmount(stockElement, amountString)
        await setPrice(driver, stockElement, priceString)

        if (!await utils.getPositionsTotal(driver) >= amount)
            return false

        await stockElement.findElement(By.xpath(location.buy_order_button)).click()

        return utils.getStockSellPrice(stockElement)
    }
}

async function setAmount(stockElement, amountString) {
    const inputAmountElement = stockElement.findElement(By.xpath(location.buy_input_amount))
    await inputAmountElement.click()
    await inputAmountElement.sendKeys(Key.CONTROL, 'a')
    await inputAmountElement.sendKeys(amountString)
}

async function setPrice(driver, stockElement, priceString) {
    await stockElement.findElement(By.xpath(location.buy_input_price_toggle)).click()
    await driver.sleep(200) // Time to let website finish animation
    const inputPriceElement = stockElement.findElement(By.xpath(location.buy_input_price_amount))
    await inputPriceElement.click()
    await inputPriceElement.sendKeys(Key.CONTROL, 'a')
    await inputPriceElement.sendKeys(priceString)
}
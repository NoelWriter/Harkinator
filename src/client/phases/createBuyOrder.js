const {By, until, Key} = require("selenium-webdriver");
const location = require("../../utils/locations")
const config = require("../../../config.json");
const utils = require("../../utils/utils");

module.exports = {
    async execute(driver, stockElement, amount = 1, price) {



        await stockElement.findElement(By.className("buy")).findElement(By.className("btn")).click()

        const amountString = amount.toFixed(config.STOCK_FRACTION_DIGITS).toString().replace('.', ',')
        const priceString = price.toFixed(config.STOCK_FRACTION_DIGITS).toString().replace('.', ',')

        await setAmount(stockElement, amountString)
        await setPrice(driver, stockElement, priceString)

        utils.log.generic(`Buying ${amountString} stocks with the price ${priceString}`)

        if (utils.getPositionsTotal > 0)
            return false
        
        await stockElement.findElement(By.xpath(location.buy_order_button)).click()

        while (!await utils.getOrdersTotal(driver) > 0 && !(await utils.getPositionsTotal(driver) > 0 && await utils.getOrdersTotal(driver) <= 0)) {
            await driver.sleep(500)
        }

        utils.log.generic(`Order placed successfully`)
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
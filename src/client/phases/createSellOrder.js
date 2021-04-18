const {By, until, Key} = require("selenium-webdriver");
const location = require("../../utils/locations")
const config = require("../../utils/config");
const utils = require("../../utils/utils");

module.exports = {
    async execute(driver, stockElement, amount = 1, price) {
        const amountString = amount.toFixed(config.getConfigValue('STOCK_FRACTION_DIGITS')).toString()

        if (amount === 0) {
            return false
        }

        if (config.getConfigValue('STOCK_ROUND_TO_WHOLE'))
            price = Math.round(price)

        const priceString = price.toFixed(config.getConfigValue('STOCK_FRACTION_DIGITS')).toString()

        utils.log.generic(`Selling ${amountString} stocks with the price ${priceString}`)
        
        let buttons = await stockElement.findElements(By.className("button-outlined"))
        await buttons[0].click()

        await setAmount(stockElement, amountString)
        await setPrice(driver, stockElement, priceString)

        // Clear open orders
        await utils.clearOpenOrders(driver)

        // Check if selling is still needed
        totalPos = await utils.getPositionsTotal(driver)
        if (totalPos !== amount || await utils.getOrdersTotal(driver) !== 0 || totalPos === 0) {
            return false
        }

        try {
            await stockElement.findElement(By.xpath(location.buy_order_button)).click()
        }catch {
            return false
        }

        let t0 = Date.now()
        while (!(await utils.getOrdersTotal(driver) > 0) && (await utils.getPositionsTotal(driver) > 0)) {
            if (await isInvalidBalance(driver)) {
                return false
            }

            if (Date.now() - t0 > 120000) {
                utils.log.error("Wait for sell order reached 2 min. Trying again..")
                return false
            }

        }

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
        await driver.findElement(By.xpath(location.order_panel_close_button)).click()
        utils.log.warning("Account financing fullscreen error found")
        return true
    } catch (e) {
        
    }

    try {
        const popuptext = await driver.findElement(By.className("popover-notification__title")).getText()
        if (popuptext === "Order geweigerd") {
            utils.log.warning("Account financing error found")
            await driver.sleep(5000)
            return true
        }
            return false
    } catch (e) {
        return false
    }
}

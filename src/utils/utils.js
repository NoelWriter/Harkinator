const chalk = require("chalk");
const location = require("./locations")
const {By} = require("selenium-webdriver");

module.exports = {
    async getStockBuyPrice(element) {
        const priceList = await element.findElement(By.className("buy")).getText()
        return parseFloat(priceList.split('\n')[0].replace('.', '').replace(',', '.'))
    },

    async getStockSellPrice(element) {
        const priceList = await element.findElement(By.className("sell")).getText()
        return parseFloat(priceList.split('\n')[0].replace('.', '').replace(',', '.'))
    },

    async getOrdersTotal(driver) {
        const stockListElements = await driver.findElements(By.tagName("trade-instrument-order-list"))
        let openOrderTotal = 0
        for (const stockListElement of stockListElements) {
            try {
                const stockAmountString = await stockListElement.findElement(By.className("quantity-badge")).getText()
                openOrderTotal += parseFloat(stockAmountString.replace("+", ""))
            } catch (e) {

            }
        }
        this.log.generic(`${openOrderTotal} orders are currently open`)
        return openOrderTotal
    },

    async getPositionsTotal(driver) {
        const stockListElements = await driver.findElements(By.tagName("trade-instrument-list-position-item-renderer"))
        let openPositionTotal = 0
        for (const stockListElement of stockListElements) {
            try {
                const stockAmountString = await stockListElement.findElement(By.className("quantity-badge")).getText()
                openPositionTotal += parseFloat(stockAmountString.replace("+", ""))
            } catch (e) {

            }
        }
        this.log.generic(`${openPositionTotal} positions are currently open`)
        return openPositionTotal
    },

    async clearOpenOrders(driver) {
        const stockListElements = await driver.findElements(By.tagName("trade-instrument-order-list"))
        for (const stockListElement of stockListElements) {
            const stockOrderElements = await stockListElement.findElements(By.tagName("trade-instrument-list-order-item-renderer"))
            for (const stockOrderElement of stockOrderElements) {
                await stockOrderElement.findElement(By.className("quantity-badge")).click()
                await driver.findElement(By.xpath(location.relative_cancel_button)).click()
                await driver.sleep(100)
            }
        }
    },

    async getSpread(element) {
        return await this.getStockBuyPrice(element) - await this.getStockSellPrice(element)
    },

    log: {
        generic(message) {
            const timestamp = this.getTimeStamp()
            console.log(chalk.greenBright(`[${timestamp}] ` + message))
        },
        warning(message) {
            const timestamp = this.getTimeStamp()
            console.log(chalk.yellowBright(`[${timestamp}] ` + message))
        },
        error(message) {
            const timestamp = this.getTimeStamp()
            console.log(chalk.redBright(`[${timestamp}] ` + message))
        },

        getTimeStamp() {
            let unix_timestamp = Date.now()
            const date = new Date(unix_timestamp);
            const hours = date.getHours();
            const minutes = "0" + date.getMinutes();
            const seconds = "0" + date.getSeconds();
            return (hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2));
        },
    },
}
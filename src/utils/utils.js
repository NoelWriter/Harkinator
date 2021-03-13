const chalk = require("chalk");
const location = require("./locations")
const {By} = require("selenium-webdriver");
const config = require("../../config.json")

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
                this.log.warning(e)
            }
        }
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
        return openPositionTotal
    },

    async getPositionHighestPrice(driver) {
        const stockListElements = await driver.findElements(By.tagName("trade-instrument-list-position-item-renderer"))
        let highestPositionAmount = 0
        for (const stockListElement of stockListElements) {
            try {
                const positionAmountString = await stockListElement.findElement(By.className("entry")).getText()
                const positionAmount = parseFloat(positionAmountString.split(" ")[1].replace('.', '').replace(',', '.'))
                if (positionAmount > highestPositionAmount)
                    highestPositionAmount = positionAmount
            } catch (e) {
                this.log.warning(e)
            }
        }
        return highestPositionAmount
    },

    async clearOpenOrders(driver) {
        try {
            const stockListElements = await driver.findElements(By.tagName("trade-instrument-order-list"))
            for (const stockListElement of stockListElements) {
                const stockOrderElements = await stockListElement.findElements(By.tagName("trade-instrument-list-order-item-renderer"))
                for (const stockOrderElement of stockOrderElements) {
                    await stockOrderElement.findElement(By.className("quantity-badge")).click()
                    await driver.findElement(By.xpath(location.relative_cancel_button)).click()
                    await driver.sleep(100)
                }
            }
        } catch (e) {
            this.log.warning("Could not find any orders to close")
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
        debug(message) {
            if (config.DEBUG) {
                const timestamp = this.getTimeStamp()
                console.log(chalk.whiteBright(`[${timestamp}] ` + message))
            }
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
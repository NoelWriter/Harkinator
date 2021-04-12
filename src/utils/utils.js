const chalk = require("chalk");
const location = require("./locations");
const { By } = require("selenium-webdriver");
const config = require("../utils/config");
const discordClient = require("../client/discordClient");
const fs = require('fs');

module.exports = {
    async getStockBuyPrice(element) {
        try {
            let prices = await element.findElements(By.className("price-ticker-value2"))
            let price = await prices[1].findElement(By.className("price-ticker-number")).getAttribute("innerHTML")
            return parseFloat(price.replace(',', ''))
        } catch (e) {
            this.log.warning("Error getting buyprice.")
            return false
        }

    },

    async getStockSellPrice(element) {
        try {
            let prices = await element.findElements(By.className("price-ticker-value2"))
            let price = await prices[0].findElement(By.className("price-ticker-number")).getAttribute("innerHTML")
            return parseFloat(price.replace(',', ''))
        } catch (e) {
            this.log.warning("Error getting sellprice.")
            return false
        }
    },

    async getBalance(driver) {
        return await driver.findElement(By.xpath(location.balance_amount)).getText()
    },

    async getOrdersTotal(driver) {
        const stockListElements = await driver.findElements(By.tagName("trade-instrument-order-list"))
        let openOrderTotal = 0
        for (const stockListElement of stockListElements) {
            try {
                const stockAmountString = await stockListElement.findElement(By.className("quantity-badge")).getText()
                openOrderTotal += parseFloat(stockAmountString.replace("+", "").replace("-", ""))
            } catch (e) {

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
                this.log.warning("getPositionsTotal(): " + e)
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
                const positionAmount = parseFloat(positionAmountString.split(" ")[1].replace(',', ''))
                if (positionAmount > highestPositionAmount)
                    highestPositionAmount = positionAmount
            } catch (e) {
                this.log.warning("getPositionHighestPrice(): " + e)
            }
        }
        return highestPositionAmount
    },

    async clearOpenOrders(driver) {
        try {
            const orderTotal = await this.getOrdersTotal(driver)
            if (orderTotal === 0) {
                this.log.debug("Could not find any orders to close")
                return
            }

            const executeOrderCancelation = async (driver) => {
                try {
                    stockList = await driver.findElement(By.xpath(location.list_of_stocks))
                    openOrders = await stockList.findElements(By.xpath("//*[contains(text(), 'Annuleren')]"))
                    for (i = 0; i < openOrders.length; i++) {
                        await openOrders[i].click()
                      }
                }catch (e){
                    this.log.debug("executeOrderCancelation(): " + e)
                }
            }

            let waitingCycles = 0
            while (await this.getOrdersTotal(driver) !== 0) {
                await executeOrderCancelation(driver)
                waitingCycles++

                if (waitingCycles > 50) {
                    waitingCycles = 0
                    this.log.warning("Platform lag detected")
                }
            }
        } catch (e) {
            this.log.warning("clearOpenOrders(): " + e)
        }
    },

    async clearOpenPosition(driver) {
        this.log.error("Force closing open positions in 60 seconds!")
        await driver.sleep(60000)
        try {
            stockList = await driver.findElement(By.xpath(location.list_of_stocks))
            openPositions = await stockList.findElements(By.xpath("//*[contains(text(), 'Sluiten')]"))
            for (i = 0; i < openPositions.length; i++) {
                await openPositions[i].click()
              }
        }catch (e){
            this.log.debug("clearOpenPosition(): " + e)
        }
    },

    async sendScreenshot(driver, msg) {
        const timestamp = this.log.getTimeStamp()
        const screenshot = await driver.takeScreenshot()
        await require('fs').writeFile('./src/temp/out.png', screenshot, 'base64', function (err) {
            if (err)
                this.log.error(err)
        });
        await msg.channel.send(`Screenshot of ${timestamp}`, { files: ['./src/temp/out.png'] })
    },

    async sendBalance(driver, msg) {
        await msg.channel.send(`Current balance is ${await this.getBalance(driver)}`)
    },

    async checkPause(driver, clearOrders = false) {
        let isPaused = false

        if (discordClient.pause) {
            await this.clearOpenOrders(driver)
            await discordClient.sendMessage(`${await this.getPositionsTotal(driver)} positions are currently open`)
        }

        while (discordClient.pause) {
            await driver.sleep(500)
            isPaused = true
        }

        return isPaused;
    },

    async getSpread(element) {
        buy = await this.getStockBuyPrice(element)
        sell = await this.getStockSellPrice(element)
        if (buy && sell) {
            return buy - sell
        } else {
            return false
        }
    },

    getOs() {
        const opsys = process.platform;
        if (opsys === "darwin") {
            return "MacOS";
        }

        return "Windows";
    },

    async setInstanceName(driver) {
        this.log.instanceName = await driver.findElement(By.xpath(location.account_name)).getText()
    },

    
    async getClosingHours(stockElement, driver) {
        await stockElement.findElement(By.className("market")).click()

        closingHours = await driver.findElements(By.className('trading-close'))
        date = new Date()

        if (date.getDay() === 0) {
            return await closingHours[2].getText()
        } else {
            return await closingHours[0].getText()
        }
    },
    
    async allowedToTrade(stockElement, driver) {
        closingtime = await this.getClosingHours(stockElement, driver)
        closingtime = closingtime.split(':')

        newdate = new Date()
        date = new Date(newdate.getFullYear(), newdate.getMonth(), newdate.getDate(), parseInt(closingtime[0]), parseInt(closingtime[1]))
        
        now = newdate.getTime() / 1000
        date = date.getTime() / 1000

        var timediff = date - now
        if (timediff < 600 && timediff > 0) {
            if (newdate.getDay() === 0) {
                this.log.warning("Pausing for 1 hour and 20 minutes")
                await driver.sleep(4800000)
            } else {
                this.log.warning("Pausing for 20 minutes")
                await driver.sleep(1200000)
            }
        }
    },

    
    log: {
        instanceName: "",
        
        generic(message, color = chalk.white) {
            const timestamp = this.getTimeStamp()
            console.log(color(`[${timestamp}] `+ this.instanceName + " - " + message))
        },
        warning(message) {
            const timestamp = this.getTimeStamp()
            console.log(chalk.yellowBright(`[${timestamp}] `+ this.instanceName + " - " + message))
        },
        error(message) {
            const timestamp = this.getTimeStamp()
            console.log(chalk.redBright(`[${timestamp}] `+ this.instanceName + " - " + message))
            discordClient.sendMessage(`[${timestamp}] `+ this.instanceName + " - " + message)
        },
        debug(message) {
            if (config.getConfigValue('DEBUG')) {
                const timestamp = this.getTimeStamp()
                console.log(chalk.whiteBright(`[${timestamp}] `+ this.instanceName + " - " + message))
            }
        },
        discord(message) {
            const timestamp = this.getTimeStamp()
            discordClient.sendMessage(`[${timestamp}] ` + this.instanceName + " - " + message)
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

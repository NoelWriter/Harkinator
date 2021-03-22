const chalk = require("chalk");
const location = require("./locations")
const { By } = require("selenium-webdriver");
const config = require("../../config.json")
const discordClient = require("../client/discordClient");

module.exports = {
    async getStockBuyPrice(element) {
        const priceList = await element.findElement(By.className("buy")).getText()
        return parseFloat(priceList.split('\n')[0].replace('.', '').replace(',', '.'))
    },

    async getStockSellPrice(element) {
        const priceList = await element.findElement(By.className("sell")).getText()
        return parseFloat(priceList.split('\n')[0].replace('.', '').replace(',', '.'))
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
                openOrderTotal += parseFloat(stockAmountString.replace("+", ""))
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
                const positionAmount = parseFloat(positionAmountString.split(" ")[1].replace('.', '').replace(',', '.'))
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
            const orderTotal = await this.getOrdersTotal(driver);
            if (orderTotal === 0) {
                this.log.debug("Could not find any orders to close")
                return
            }

            const executeOrderCancelation = async (driver) => {
                const stockListElements = await driver.findElements(By.tagName("trade-instrument-order-list"))
                for (const stockListElement of stockListElements) {
                    const stockOrderElements = await stockListElement.findElements(By.tagName("trade-instrument-list-order-item-renderer"))
                    for (const stockOrderElement of stockOrderElements) {
                        try {
                            await driver.findElement(By.xpath(location.buy_cancel_button)).click()
                            await driver.findElement(By.xpath(location.sell_cancel_button)).click()
                        } catch (e) {
                            this.log.debug("executeOrderCancelation(): " + e)
                        }

                    }
                }
            }

            let waitingCycles = 0
            while (await this.getOrdersTotal(driver) !== 0) {
                await executeOrderCancelation(driver)
                waitingCycles++

                if (waitingCycles > 20) {
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
            await stocklist.findElement(By.xpath("//*[contains(text(), 'Sluiten')]")).click()
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
        return await this.getStockBuyPrice(element) - await this.getStockSellPrice(element)
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

    
    log: {
        instanceName: "",
        
        generic(message) {
            const timestamp = this.getTimeStamp()
            console.log(chalk.greenBright(`[${timestamp}] `+ this.instanceName + " - " + message))
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
            if (config.DEBUG) {
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
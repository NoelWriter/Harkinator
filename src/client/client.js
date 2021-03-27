const login = require("./phases/login")
const enterMode = require("./phases/enterMode")
const findStock = require("./phases/getStock")
const createBuyOrder = require("./phases/createBuyOrder")
const awaitBuyOrder = require("./phases/awaitBuyOrder")
const findPrice = require("./phases/findPrice")
const createSellOrder = require("./phases/createSellOrder")
const awaitSellOrder = require("./phases/awaitSellOrder")
const chalk = require("chalk");

const webdriver = require("../client/webdriver")
const locations = require("../utils/locations")
const config = require("../utils/config");
const utils = require("../utils/utils");
const {By} = require("selenium-webdriver");

module.exports = {
    instanceName: "",
    stockName: "",
    intance: 0,
    discordClientInstance: "",
    driverStartDate: Date.now(),
    balance: 0.0,

    /**
     * Execute client instance
     *
     * @param {string} stockName
     * @param instance
     * @param delay
     * @param discordClientInstance
     */
    async execute (stockName, instance, delay, discordClientInstance) {

        this.stockName = stockName
        this.instance = instance
        this.discordClientInstance = discordClientInstance
        this.driverStartDate = Date.now()

        // Timeout between starting instances to prevent internet clogging
        await new Promise(resolve => setTimeout(resolve, delay));

        // Initialize webdriver
        utils.log.generic(`Initialising Harkinator: ` + instance)
        
        let driver = await getDriver()
        
        discordClientInstance.on("message", msg => {
            if (msg.content.toLowerCase() === 's' && msg.author.id === config.getAuthValue('DISCORD_USERID')) {
                utils.sendScreenshot(driver, msg)
            }
        })

        // Initialize client login and account
        const stockElement = await init(driver, instance)

        if (!stockElement) {
            driver.quit()
            await this.execute(this.stockName, this.instance, 0, this.discordClientInstance)
        }

        await utils.setInstanceName(driver)

        utils.log.generic(`Starting trading sequence`)
        utils.log.generic(`Probing buy and sell price = ${await utils.getStockBuyPrice(stockElement)} | ${await utils.getStockSellPrice(stockElement)}`)

        const positions = await utils.getPositionsTotal(driver)
        utils.log.debug("POSITIONS : " + positions)

        this.balance = await utils.getBalance(driver)

        while (true) {
            await utils.checkPause(driver)
            await this.trade(driver, stockElement)
        }
    },

    /**
     * @param {*} driver
     * @param {*} stockElement
     */
    async trade(driver, stockElement) {
        utils.log.generic(`Starting trade`)
        this.balance = await utils.getBalance(driver)

        // Clear all open orders
        await utils.clearOpenOrders(driver)

        // Clear any open positions
        if (await utils.getPositionsTotal(driver) !== 0) {
            utils.log.error("Positions are still open!")
            
            if (config.getConfigValue('FORCE_CLOSE_OPEN_POSITIONS'))
                await utils.clearOpenPosition(driver)
        }

        // Shutdown session when quit order is given
        if (config.getConfigValue("QUIT_INSTANCES")) {
            await driver.quit()
            utils.log.warning(`SHUTDOWN DONE`)
            process.exit()
        }

        // Restart webdriver session to clear memory
        if ((Date.now() - this.driverStartDate) > 3600000 && !config.getConfigValue('TWO_FACT_AUTH')) {
            await driver.quit()
            await this.execute(this.stockName, this.instance, 0, this.discordClientInstance)
        }

        // Close trading panel to prevent buying high
        try {
            await driver.findElement(By.xpath(locations.order_panel_close_button)).click()
        } catch (e) { }

        // Check if pause has been called
        await utils.checkPause(driver)

        // Fetch current spread
        const initialSpread = await utils.getSpread(stockElement)
        
        // Start new trade when getspread returns false
        if (!initialSpread)
            return

        utils.log.generic(`Initial spread: ${initialSpread}`)

        // Probe lag to maintain bot functionality
        utils.log.generic(`Probing platform lag...`)
        const platformLag = await probePlatformLatency(driver, stockElement)

        if (!platformLag)
            return
        
        utils.log.generic(`Buy order delay is currently ${platformLag}ms`)

        if (platformLag > config.getConfigValue('LAG_MAX_ORDER_DELAY')) {
            const sleepAmount = config.getConfigValue('DELAY_PLATFORM_LAG')
            utils.log.warning(`Platform lag detected, buy order delay is currently ${platformLag}ms. Hibernating for ${sleepAmount/1000} seconds`)
            await driver.sleep(sleepAmount)
            return
        }

        // Find buy price
        const price = await findPrice.buy(driver, stockElement, config.getConfigValue('STOCK_MULTIPLIER_ABOVE_SELL'))
        const curSellLevel = await utils.getStockSellPrice(stockElement)
        utils.log.generic(`Found price at ${price}`)

        // Create buy order
        const sellLevel = await createBuyOrder.execute(driver, stockElement, config.getConfigValue('STOCK_AMOUNT'), price, curSellLevel)
        if (!sellLevel)
            return


        // Wait for buy order to be filled
        const boughtSellLevel = await awaitBuyOrder.execute(driver, stockElement, config.getConfigValue('STOCK_AMOUNT'), sellLevel)
        if (!boughtSellLevel)
            return
    

        // Find the sell price for the positions held
        let curSellPrice = await findPrice.sell(driver, stockElement, config.getConfigValue('STOCK_PROFIT'))
        utils.log.debug("Sell price : " + curSellPrice.toString())

        // Loop to keep updating sell position
        while (await utils.getPositionsTotal(driver) > 0) {
            // Clear open orders
            await utils.clearOpenOrders(driver)

            // Get amount of positions to create orders for
            let positions = await utils.getPositionsTotal(driver)
            
            // Create an initial order for current position
            var curSellPriceLevel = await createSellOrder.execute(driver, stockElement, positions, curSellPrice)
            if (!curSellPriceLevel)
                continue
            
            while (await utils.getPositionsTotal(driver) > 0) {
                await utils.checkPause(driver)

                // Check for changes in price or fulfillment
                positions = await utils.getPositionsTotal(driver)
                const newSellPrice = await awaitSellOrder.execute(driver, stockElement, positions, boughtSellLevel, curSellPriceLevel)
                utils.log.debug("New sell price : " + newSellPrice.toString())
                if (newSellPrice)
                    curSellPrice = newSellPrice
                
                // Check for unexpected difference in positions and orders (when positions fails to update in sync with sell)
                while (await utils.getPositionsTotal(driver) !== await utils.getOrdersTotal(driver)) {
                    continue
                }

                // Create an updated order
                positions = await utils.getPositionsTotal(driver)
                pricelevel = await createSellOrder.execute(driver, stockElement, positions, curSellPrice)
                if (pricelevel) {
                    curSellPriceLevel = pricelevel
                } else {
                    break
                }
            
            }

            
        }
        var newBalance = await utils.getBalance(driver)
        newBalance = newBalance.replace("€", "").replace('.', '').replace(',', '.')
        this.balance = this.balance.replace("€", "").replace('.', '').replace(',', '.')
        var balDifference = parseFloat(newBalance) - parseFloat(this.balance)
        balDifference = balDifference.toFixed(2)
        if (balDifference > 0) {
            utils.log.generic(`====PROFIT: €${balDifference} balance is now at €${newBalance}====`, chalk.greenBright)
            utils.log.discord(`PROFIT: €${balDifference} balance is now at €${newBalance}`)
        } else if (balDifference == 0) {
            utils.log.generic(`====PROFIT: €${balDifference} balance is now at €${newBalance}====`, chalk.greenBright)
            utils.log.discord(`PROFIT: €${balDifference} balance is now at €${newBalance}`)
        } else if (balDifference < 0) {
            utils.log.generic(`====LOSS: €${balDifference} balance is now at €${newBalance}====`, chalk.greenBright)
            utils.log.discord(`LOSS: €${balDifference} balance is now at €${newBalance}`)
        }


    }
}

/**
 * @param {*} driver
 * @param instance
 */
async function init(driver, instance) {
    // Log in user
    try {
        const loginSucces = await login.execute(driver, config.getAuthValue('USERNAME'), config.getAuthValue('PASSWORD'), config.getConfigValue('TWO_FACT_AUTH'))

        if(!loginSucces)
            return false

        // Enter specified mode
        await enterMode.execute(driver, config.getConfigValue('DEMO_MODE'), instance)

        // Find stock
        const stockElement = await findStock.execute(driver, config.getConfigValue('STOCK_PRIMARY'))

        if (!stockElement)
            throw 'stockElement not found';

        return stockElement
    } catch (e) {
        return false
    }
    
}

async function probePlatformLatency(driver, stockElement) {
    let t0 = Date.now()
    buyOrderResponse = await createBuyOrder.execute(driver, stockElement, config.getConfigValue('STOCK_PROBE_AMOUNT'), await utils.getStockSellPrice(stockElement) * 0.8)

    if (!buyOrderResponse) {
        utils.log.warning('Probe order failed. Trying again..')
        return false
    }

    let t1 = Date.now()
    await utils.clearOpenOrders(driver)
    return t1 - t0
}

async function getDriver() {
    return await webdriver.start()
}


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
const {getConfigValue} = require("../utils/config");
const {setConfigValue} = require("../utils/config");
const {By} = require("selenium-webdriver");
const fetch = require('node-fetch');
const timeoutSignal = require("timeout-signal");


module.exports = {
    instanceName: "",
    stockName: "",
    instance: 0,
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
        await driver.sleep(2000)
        utils.log.generic(`Probing buy and sell price = ${await utils.getStockBuyPrice(stockElement)} | ${await utils.getStockSellPrice(stockElement)}`)

        const positions = await utils.getPositionsTotal(driver)
        utils.log.debug("POSITIONS : " + positions)

        this.balance = await utils.getBalance(driver)

        let tradeCounter = 0
        while (true) {
            tradeCounter++
            if ((tradeCounter % 10 === 0 || tradeCounter === 1) && config.getConfigValue("STOCK_PRIMARY") === "Bitcoin / USD" && instance === 2 ) {
                utils.log.generic("Starting Bitcoin Multiplier Probe")
                let newMultiplier = await probeBitcoinPrice(driver, stockElement)
                utils.log.generic("New Multiplier set at " + newMultiplier)
            }

            await utils.checkPause(driver)
            await this.trade(driver, stockElement)
        }
    },

    /**
     * @param {*} driver
     * @param {*} stockElement
     */
    async trade(driver, stockElement) {
        // Check for market pauses
        if (config.getConfigValue("STOCK_PRIMARY") === "Bitcoin / USD") {
            await utils.allowedToTrade(stockElement, driver)
        }

        utils.log.generic(`Starting trade`)

        // Get balance and prepare it for comparison
        this.balance = await utils.getBalance(driver)
        this.balance = this.balance.replace("€", "").replace('.', '').replace(',', '.')

        // Pauses instance when stock limit stop is reached
		if (this.balance < config.getConfigValue("STOCK_LIMIT_STOP") ){
			utils.log.error("Trading suspended because the stock_limit_stop was reached")
			while (true)
				await driver.sleep(500)
		}

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

        if (!boughtSellLevel) {
            // Clear any open positions
            var curpos = await utils.getPositionsTotal(driver)
            if (curpos < 0 || curpos == 0) {
                return
            } else {
                boughtSellLevel = await utils.getStockSellPrice(stockElement)
            }
        }


            
    

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

                if (await utils.getOrdersTotal(driver) > 0) {
                    // Check for changes in price or fulfillment
                    positions = await utils.getPositionsTotal(driver)
                    const newSellPrice = await awaitSellOrder.execute(driver, stockElement, positions, boughtSellLevel, curSellPriceLevel)
                    utils.log.debug("New sell price : " + newSellPrice.toString())
                    if (newSellPrice)
                        curSellPrice = newSellPrice
                }

                // Create an updated order
                positions = await utils.getPositionsTotal(driver)
                pricelevel = await createSellOrder.execute(driver, stockElement, positions, curSellPrice)
                
                if (pricelevel)
                    curSellPriceLevel = pricelevel
            
            }
        }

        let newBalance = await utils.getBalance(driver)
        newBalance = newBalance.replace("€", "").replace('.', '').replace(',', '.')

        var balDifference = parseFloat(newBalance) - parseFloat(this.balance)
        balDifference = balDifference.toFixed(2)
        if (balDifference > 0) {
            utils.log.generic(`====PROFIT: €${balDifference} balance is now at €${newBalance}====`, chalk.greenBright)
            utils.log.discord(`PROFIT: €${balDifference} balance is now at €${newBalance}`)
        } else if (balDifference == 0.0) {
            utils.log.generic(`====BREAK-EVEN: €${balDifference} balance is now at €${newBalance}====`, chalk.greenBright)
            utils.log.discord(`BREAK-EVEN: €${balDifference} balance is now at €${newBalance}`)
        } else if (balDifference < 0) {
            utils.log.generic(`====LOSS: €${balDifference} balance is now at €${newBalance}====`, chalk.redBright)
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

async function probeBitcoinPrice(driver, stockElement) {
    let deltaArray = []
    let timestampArray = []
    const probeSeconds = 60
    utils.log.generic(`Probing new multiplier for +/- ${probeSeconds} seconds`)

    for (let i = 0; i < probeSeconds; i++) {
        let curSpread = await utils.getSpread(stockElement)
        let curSellprice = await utils.getStockSellPrice(stockElement)
        let curTimestamp = Date.now() / 1000

        if (i % 20 === 0)
            utils.log.generic(`Probing has ${probeSeconds - i} seconds left`)

        timestampArray.push([curSpread, curSellprice, curTimestamp])
        await driver.sleep(1000)
    }

    let res = await fetch('http://api.bitcoincharts.com/v1/trades.csv?symbol=bitstampUSD', { signal: timeoutSignal(15000) });
    res = await res.text()
    const resPointArray = res.split('\n')

    for (const timestampArrayItem of timestampArray) {
        for (let i = 0; i < 60; i++) {
            const pointTimestamp = parseInt(resPointArray[i].split(',')[0])
            const arrayTimestamp = Math.round(timestampArrayItem[2])

            if (pointTimestamp === arrayTimestamp) {
                const pointSellPrice = parseFloat(resPointArray[i].split(',')[1])
                const arraySellPrice = timestampArrayItem[1]
                const arraySpread = timestampArrayItem[0]
                const curMultiplier = (pointSellPrice - arraySellPrice) / arraySpread

                if (curMultiplier < 0)
                    utils.log.warning(`${pointTimestamp} | ${arrayTimestamp} : ${pointSellPrice} | ${arraySellPrice} | ${arraySpread}`)
                else
                    deltaArray.push(curMultiplier)
            }
        }
    }

    let newMultiplierAboveSell = calculateAverage(deltaArray) - ((config.getConfigValue("STOCK_PROFIT") + 0.01))
    if (newMultiplierAboveSell < 0.05)
        newMultiplierAboveSell = 0.05
    if (newMultiplierAboveSell > 0.35)
        newMultiplierAboveSell = 0.3
    if (isNaN(newMultiplierAboveSell))
        newMultiplierAboveSell = 0.2

    config.setConfigValue("STOCK_MULTIPLIER_ABOVE_SELL", newMultiplierAboveSell)
    return newMultiplierAboveSell
}

function calculateAverage(array) {
    let i = 0, sum = 0, len = array.length;
    while (i < len) {
        sum = sum + array[i++];
    }
    return sum / len;
}

async function getDriver() {
    return await webdriver.start()
}


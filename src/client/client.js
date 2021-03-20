const login = require("./phases/login")
const enterMode = require("./phases/enterMode")
const findStock = require("./phases/getStock")
const createBuyOrder = require("./phases/createBuyOrder")
const awaitBuyOrder = require("./phases/awaitBuyOrder")
const findPrice = require("./phases/findPrice")
const createSellOrder = require("./phases/createSellOrder")
const awaitSellOrder = require("./phases/awaitSellOrder")

const webdriver = require("../client/webdriver")
const locations = require("../utils/locations")
const config = require("../../config.json");
const utils = require("../utils/utils")
const {By} = require("selenium-webdriver");

module.exports = {
    instanceName: "",
    /**
     * Execute client instance
     *
     * @param {string} stockName
     * @param instance
     * @param delay
     * @param discordClientInstance
     */
    async execute (stockName, instance, delay, discordClientInstance) {

        // Timeout between starting instances to prevent internet clogging
        await new Promise(resolve => setTimeout(resolve, delay));

        // Initialize webdriver
        utils.log.generic(`Initialising Harkinator: ` + instance)
        const driver = await webdriver.start()

        discordClientInstance.on("message", msg => {
            if (msg.content.toLowerCase() === 's' && msg.author.id === config.DISCORD_USERID) {
                utils.sendScreenshot(driver, msg)
            }
        })

        // Initialize client login and account
        const stockElement = await init(driver, instance)
        await utils.setInstanceName(driver)

        utils.log.generic(`Starting trading sequence`)
        utils.log.generic(`Probing buy and sell price = ${await utils.getStockBuyPrice(stockElement)} | ${await utils.getStockSellPrice(stockElement)}`)

        const positions = await utils.getPositionsTotal(driver)
        utils.log.debug("POSITIONS : " + positions)

        while (true) {
            await utils.checkPause(driver)
            await trade(driver, stockElement)
        }
    },
}

/**
 * @param {*} driver
 * @param instance
 */
async function init(driver, instance) {
    // Log in user
    await login.execute(driver, config.USERNAME, config.PASSWORD, config.TWO_FACT_AUTH)

    // Enter specified mode
    await enterMode.execute(driver, config.DEMO_MODE, instance)

    // Find stock
    const stockElement = await findStock.execute(driver, config.STOCK_PRIMARY)

    if (!stockElement)
        throw 'stockElement not found';

    return stockElement
}

/**
 * @param {*} driver
 * @param {*} stockElement
 */
async function trade(driver, stockElement) {
    utils.log.generic(`Starting trade`)

    // Clear all open orders
    await utils.clearOpenOrders(driver)

    // Close trading panel to prevent buying high
    try {
        await driver.findElement(By.xpath(locations.order_panel_close_button)).click()
    } catch (e) { }

    // Check if pause has been called
    await utils.checkPause(driver)

    // Clear any open positions
    if (await utils.getPositionsTotal(driver) !== 0) {
        utils.log.error("Positions are still open!")
        
        if (config.FORCE_CLOSE_OPEN_POSITIONS)
            await utils.clearOpenPosition(driver)
            
    }

    // Fetch current spread
    const initialSpread = await utils.getSpread(stockElement)
    utils.log.generic(`Initial spread: ${initialSpread}`)

    // Probe lag to maintain bot functionality
    utils.log.generic(`Probing platform lag...`)
    const platformLag = await probePlatformLatency(driver, stockElement)
    utils.log.generic(`Buy order delay is currently ${platformLag}ms`)

    if (platformLag > config.LAG_MAX_ORDER_DELAY) {
        const sleepAmount = config.DELAY_PLATFORM_LAG
        utils.log.warning(`Platform lag detected, buy order delay is currently ${platformLag}ms. Hibernating for ${sleepAmount/1000} seconds`)
        await driver.sleep(sleepAmount)
        return
    }

    // Find buy price
    const price = await findPrice.buy(driver, stockElement, config.STOCK_MULTIPLIER_ABOVE_SELL)
    const curSellLevel = await utils.getStockSellPrice(stockElement)
    utils.log.generic(`Found price at ${price}`)

    // Create buy order
    const sellLevel = await createBuyOrder.execute(driver, stockElement, config.STOCK_AMOUNT, price, curSellLevel)
    if (!sellLevel)
        return

    // Wait for buy order to be filled
    const boughtSellLevel = await awaitBuyOrder.execute(driver, stockElement, config.STOCK_AMOUNT, sellLevel)
    if (!boughtSellLevel)
        return

    // Find the sell price for the positions held
    let curSellPrice = await findPrice.sell(driver, stockElement, config.STOCK_PROFIT)
    utils.log.debug("Sell price : " + curSellPrice.toString())

    // Loop to keep updating sell position
    while (await utils.getPositionsTotal(driver) > 0) {
        // Clear open orders
        await utils.clearOpenOrders(driver)
        await utils.checkPause(driver)

        // Get amount of positions to create orders for
        let positions = await utils.getPositionsTotal(driver)

        // Create an order for current position
        const curSellPriceLevel = await createSellOrder.execute(driver, stockElement, positions, curSellPrice)
        if (!curSellPriceLevel)
            continue

        // Check for changes in price or fulfillment
        const newSellPrice = await awaitSellOrder.execute(driver, stockElement, positions, boughtSellLevel, curSellPrice, curSellPriceLevel)
        utils.log.debug("New sell price : " + newSellPrice.toString())
        if (newSellPrice)
            curSellPrice = newSellPrice
    }

    utils.log.discord(`:moneybag: ${await utils.getBalance(driver)} :moneybag:`)
}

async function probePlatformLatency(driver, stockElement) {
    let t0 = Date.now()
    await createBuyOrder.execute(driver, stockElement, config.STOCK_PROBE_AMOUNT, await utils.getStockSellPrice(stockElement) * 0.8)
    let t1 = Date.now()
    await utils.clearOpenOrders(driver)
    return t1 - t0
}


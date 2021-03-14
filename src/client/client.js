const login = require("./phases/login")
const enterMode = require("./phases/enterMode")
const findStock = require("./phases/getStock")
const createBuyOrder = require("./phases/createBuyOrder")
const awaitBuyOrder = require("./phases/awaitBuyOrder")
const findPrice = require("./phases/findPrice")
const createSellOrder = require("./phases/createSellOrder")
const awaitSellOrder = require("./phases/awaitSellOrder")

const discordClient = require("./discordClient")

const webdriver = require("../client/webdriver")
const config = require("../../config.json");
const location = require("../utils/locations")
const utils = require("../utils/utils")
const chalk = require("chalk");
const {By, until} = require("selenium-webdriver");

module.exports = {
    /**
     * Execute client instance
     *
     * @param {string} stockName
     */
    async execute (stockName) {
        utils.log.generic(`Initialising the Harkinator`)
        const driver = await webdriver.start()
        const stockElement = await init(driver)

        const discordClientInstance = await discordClient.init(config.DISCORD_TOKEN)

        discordClientInstance.on("message", msg => {
            if (msg.content.toLowerCase() === 's') {
                utils.sendScreenshot(driver)
            }
        })

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
 */
async function init(driver) {
    // Log in user
    await login.execute(driver, config.USERNAME, config.PASSWORD)

    // Enter specified mode
    await enterMode.execute(driver, config.DEMO_MODE, config.LIVE_ACCOUNT_NUM)

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
    await utils.clearOpenOrders(driver)
    await utils.checkPause(driver)

    const initialSpread = await utils.getSpread(stockElement)
    utils.log.generic(`Initial spread: ${initialSpread}`)

    const price = await findPrice.buy(driver, stockElement, config.STOCK_MULTIPLIER_ABOVE_SELL)
    utils.log.generic(`Found price at ${price}`)

    const sellLevel = await createBuyOrder.execute(driver, stockElement, config.STOCK_AMOUNT, price)
    if (!sellLevel)
        return

    const boughtSellLevel = await awaitBuyOrder.execute(driver, stockElement, config.STOCK_AMOUNT, sellLevel)
    if (!boughtSellLevel)
        return

    let curSellPrice = await findPrice.sell(driver, stockElement, config.STOCK_PROFIT)
    utils.log.debug("Sell price : " + curSellPrice.toString())

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

    await driver.sleep(500)
}

async function probePlatformLatency(driver, stockElement) {
    const t0 = performance.now()
    await createBuyOrder.execute(driver, stockElement, 1, this.getStockSellPrice(stockElement))
    const t1 = performance.now()
    return t1 - t0
}


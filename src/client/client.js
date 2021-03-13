const login = require("./phases/login")
const enterMode = require("./phases/enterMode")
const findStock = require("./phases/getStock")
const createBuyOrder = require("./phases/createBuyOrder")
const awaitBuyOrder = require("./phases/awaitBuyOrder")
const findPrice = require("./phases/findPrice")
const createSellOrder = require("./phases/createSellOrder")
const awaitSellOrder = require("./phases/awaitSellOrder")

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

        utils.log.generic(`Starting trading sequence`)
        utils.log.generic(`Probing buy and sell price = ${await utils.getStockBuyPrice(stockElement)} | ${await utils.getStockSellPrice(stockElement)}`)

        const positions = await utils.getPositionsTotal(driver)
        utils.log.debug("POSITIONS : " + positions)

        while (true) {
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

    const initialSpread = await utils.getSpread(stockElement)
    utils.log.generic(`Initial spread: ${initialSpread}`)

    const price = await findPrice.buy(driver, stockElement, config.STOCK_MULTIPLIER_ABOVE_SELL)
    utils.log.generic(`Found price at ${price}`)

    const sellLevel = await createBuyOrder.execute(driver, stockElement, config.STOCK_AMOUNT, price)

    const boughtSellLevel = await awaitBuyOrder.execute(driver, stockElement, config.STOCK_AMOUNT, sellLevel)
    if (!boughtSellLevel)
        return

    let curSellPrice = await findPrice.sell(driver, stockElement, config.STOCK_PROFIT)
    utils.log.debug("Sell price : " + curSellPrice.toString())

    while (await utils.getPositionsTotal(driver) > 0) {
        // Clear open orders
        await utils.clearOpenOrders(driver)

        // Get amount of positions to create orders for
        let positions = await utils.getPositionsTotal(driver)

        // Create an order for current position
        const curSellPriceLevel = await createSellOrder.execute(driver, stockElement, positions, curSellPrice)

        // Check for changes in price or fulfillment
        const newSellPrice = await awaitSellOrder.execute(driver, stockElement, positions, boughtSellLevel, curSellPrice, curSellPriceLevel)
        utils.log.debug("New sell price : " + newSellPrice.toString())
        if (newSellPrice)
            curSellPrice = newSellPrice
    }

    await driver.sleep(1000)
}

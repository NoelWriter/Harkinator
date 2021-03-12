const login = require("./phases/login")
const enterMode = require("./phases/enterMode")
const findStock = require("./phases/getStock")
const createBuyOrder = require("./phases/createBuyOrder")
const findPrice = require("./phases/findPrice")

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

        await trade(driver, stockElement)
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

    const price = await findPrice.execute(driver, stockElement, config.STOCK_MULTIPLIER_ABOVE_SELL)
    utils.log.generic(`Found price at ${price}`)

    await createBuyOrder.execute(driver, stockElement, config.STOCK_AMOUNT, price)

    utils.log.generic(await utils.getPositionsTotal(driver))

}

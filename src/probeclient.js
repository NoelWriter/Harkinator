// ----------------------------------------------------------------
//                     HARKINATOR PROBE CLIENT
// ----------------------------------------------------------------
const findStock = require("./client/phases/getStock");
const config = require("./utils/config")
const utils = require("../src/utils/utils");
const login = require("./client/phases/login")
const webdriver = require("./client/webdriver");
const fetch = require('node-fetch');
const timeoutSignal = require("timeout-signal");
const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const csvWriter = createCsvWriter({
    header: ['Time', 'Multiplier Above Sell (Rounded)', 'Determined Multiplier Above Sell'],
    path: './logs/multiplierprobe.csv',
    append: true
});

main()

async function main() {
    this.driverStartDate = Date.now()

    // Initialize webdriver
    utils.log.generic(`Initialising Probing Client`)

    // Initialize driver
    const driver = await getDriver()

    // Initialize client login and account
    const stockElement = await init(driver)

    if (!stockElement)
        console.log(stockElement)

    while (true) {
        let deltaArray = []
        let timestampArray = []
        const probeSeconds = 240
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
            for (let i = 0; i < 240; i++) {
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

        let averageMultiplier = calculateAverage(deltaArray)
        let multiplierAboveSell = averageMultiplier - ((config.getConfigValue("STOCK_PROFIT") + config.getConfigValue("STOCK_BUY_LOWER_LIMIT") + 0.05))

        if (multiplierAboveSell < 0.05)
            multiplierAboveSell = 0.05
        if (multiplierAboveSell > 0.30)
            multiplierAboveSell = 0.30
        if (isNaN(multiplierAboveSell))
            multiplierAboveSell = 0.05

        await csvWriter.writeRecords([[Date.now(), multiplierAboveSell, averageMultiplier]])
        utils.log.generic(`Result written to CSV with resulting MAS being ${multiplierAboveSell}`)

        config.setConfigValue("STOCK_MULTIPLIER_ABOVE_SELL", multiplierAboveSell)
    }
}

function calculateAverage(array) {
    let i = 0, sum = 0, len = array.length;
    while (i < len) {
        sum = sum + array[i++];
    }
    return sum / len;
}

/**
 * @param {*} this.driver
 * @param driver
 */
async function init(driver) {
    // Log in user
    try {
        const loginSucces = await login.execute(driver, config.getAuthValue('USERNAME'), config.getAuthValue('PASSWORD'), config.getConfigValue('TWO_FACT_AUTH'))

        if (!loginSucces)
            return false

        await driver.sleep(1000)

        // Find stock
        const stockElement = await findStock.execute(driver, config.getConfigValue('STOCK_PRIMARY'))

        if (!stockElement)
            throw 'stockElement not found';

        return stockElement
    } catch (e) {
        return false
    }
}

async function getDriver() {
    return webdriver.start();
}
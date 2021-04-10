// ----------------------------------------------------------------
//                           HARKINATOR
// ----------------------------------------------------------------
console.log("Initializing main")
const client = require("./client/client")
const config = require("./utils/config")
const discordClient = require("./client/discordClient")

process.setMaxListeners(100)

console.log("Initializing Discord Client")
discordClient.init(config.getAuthValue('DISCORD_TOKEN')).then((discordClientInstance) => {
    const instance = parseInt(process.argv[2])
    client.execute(config.getConfigValue('STOCK_PRIMARY'), instance+1, 5000*instance, discordClientInstance)
})

// Error handling
process.on('SIGINT', () => {
    process.exit()
});

process.on("unhandledRejection", async(error) => {
    utils.log.error(`UnhandledRejection Error: ${error}`)
    await client.driver.quit()
    process.exit()
});

process.on("TypeError", async(error) => {
    utils.log.error(`TypeError: ${error}`)
    await client.driver.quit()
    process.exit()
});

process.on("uncaughtException", async(error) => {
    utils.log.error(`UncaughtException: ${error}`)
    await client.driver.quit()
    process.exit()
});

process.on("uncaughtExceptionMonitor", async(error) => {
    utils.log.error(`UncaughtExceptionMonitor: ${error}`)
    await client.driver.quit()
    process.exit()
});

process.on("MaxListenersExceededWarning", async(error) => {
    utils.log.error(`MaxListenersExceededWarning: ${error}`)
    await client.driver.quit()
    process.exit()
});

process.on("warning", (warning) => {
    utils.log.warning(`Warning ${warning}`)
});
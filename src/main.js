// ----------------------------------------------------------------
//                           HARKINATOR
// ----------------------------------------------------------------
const config = require("./config/config.json");
const client = require("./client/client")
const utils = require("./utils/utils")
const discordClient = require("./client/discordClient")

discordClient.init(config.DISCORD_TOKEN).then((discordClientInstance) => {
 

    const instance = parseInt(process.argv[2])

    client.execute(config.STOCK_PRIMARY, instance+1, 10000*instance, discordClientInstance)

})

// Error handling
process.on('SIGINT', () => {
    process.exit();
});

process.on("unhandledRejection", (error) => {
    utils.log.error(`Uncaught Error: ${error}`)
});

process.on("TypeError", (error) => {
    utils.log.error(`Uncaught Error: ${error}`)
});

process.on("uncaughtExceptionMonitor", (error) => {
    utils.log.error(`Uncaught Exception: ${error}`)
});

process.on("warning", (warning) => {
    utils.log.warning(`Warning ${warning}`)
});
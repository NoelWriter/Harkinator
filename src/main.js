// ----------------------------------------------------------------
//                           HARKINATOR
// ----------------------------------------------------------------
const client = require("./client/client")
const config = require("./utils/config")
const discordClient = require("./client/discordClient")

discordClient.init(config.getAuthValue('DISCORD_TOKEN')).then((discordClientInstance) => {
    const instance = parseInt(process.argv[2])
    client.execute(config.getConfigValue('STOCK_PRIMARY'), instance+1, 5000*instance, discordClientInstance)
})

// Error handling
// process.on('SIGINT', () => {
//     process.exit();
// });

// process.on("unhandledRejection", (error) => {
//     utils.log.error(`Uncaught Error: ${error}`)
// });

// process.on("TypeError", (error) => {
//     utils.log.error(`Uncaught Error: ${error}`)
// });

// process.on("uncaughtExceptionMonitor", (error) => {
//     utils.log.error(`Uncaught Exception: ${error}`)
// });

// process.on("warning", (warning) => {
//     utils.log.warning(`Warning ${warning}`)
// });
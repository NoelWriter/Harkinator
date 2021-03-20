// ----------------------------------------------------------------
//                           HARKINATOR
// ----------------------------------------------------------------
const config = require("./config/config.json");
const client = require("./client/client")
const utils = require("./utils/utils")

client.execute(config.STOCK_PRIMARY)

// Error handling
// process.on('SIGINT', () => {
//     process.exit();
// });
//
// process.on("unhandledRejection", (error) => {
//     utils.log.error(`Uncaught Error: ${error}`)
// });
//
// process.on("TypeError", (error) => {
//     utils.log.error(`Uncaught Error: ${error}`)
// });
//
// process.on("uncaughtExceptionMonitor", (error) => {
//     utils.log.error(`Uncaught Exception: ${error}`)
// });
//
// process.on("warning", (warning) => {
//     utils.log.warning(`Warning ${warning}`)
// });
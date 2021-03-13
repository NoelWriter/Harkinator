const Discord = require('discord.js');
const config = require("../../config.json");

let discordClient = new Discord.Client();

module.exports = {
    async init () {
        await discordClient.login(config.DISCORD_TOKEN);
        return discordClient
    },

    async sendMessage (message) {
        let user = await discordClient.users.fetch(config.DISCORD_USERID);
        const dm = await user.createDM()
        await dm.send(message)
    },
}
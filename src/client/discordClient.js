const Discord = require('discord.js');
const config = require("../utils/config");

let discordClient = new Discord.Client();

module.exports = {
    pause: false,
    async init () {
        await discordClient.login(config.getAuthValue('DISCORD_TOKEN'));

        discordClient.on("message", msg => {
            if (msg.content.toLowerCase() === 'p') {
                if (msg.author.id === config.getAuthValue('DISCORD_USERID')) {
                    this.pause = !this.pause
                    if (this.pause) {
                        this.sendMessage("Paused bot")
                    } else {
                        this.sendMessage("Resumed bot")
                    }
                }
            }
        })

        return discordClient
    },

    async sendMessage (message, file = false) {
        let user = await discordClient.users.fetch(config.getAuthValue('DISCORD_USERID'));
        const dm = await user.createDM()
        if (file)
            await dm.send(message, { files: [file] })
        else
            await dm.send(message)
    },
}
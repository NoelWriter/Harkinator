const Discord = require('discord.js');
const config = require("../config/config.json");

let discordClient = new Discord.Client();

module.exports = {
    pause: false,
    async init () {
        await discordClient.login(config.DISCORD_TOKEN);

        discordClient.on("message", msg => {
            if (msg.content.toLowerCase() === 'p') {
                if (msg.author.id === config.DISCORD_USERID) {
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
        let user = await discordClient.users.fetch(config.DISCORD_USERID);
        const dm = await user.createDM()
        if (file)
            await dm.send(message, { files: [file] })
        else
            await dm.send(message)
    },
}
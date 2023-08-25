import { Client, GatewayIntentBits } from "discord.js";
import interactionCreate from "./interactionCreate";
import slashBuilder from "./slashBuilder";
import env from 'dotenv';
env.config();

export const BOT = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

BOT.on('ready', () => {
    console.log("Ready!")
    slashBuilder();
});
BOT.on('interactionCreate', interactionCreate);
BOT.login(process.env.TOKEN);
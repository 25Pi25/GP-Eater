import { Client, GatewayIntentBits } from "discord.js";
import handleInteraction from "./handleInteraction";
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

slashBuilder();
BOT.on('ready', () => console.log("Ready!"));
BOT.on('interactionCreate', handleInteraction);
BOT.login(process.env.TOKEN);
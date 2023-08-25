import { ApplicationCommandDataResolvable, ApplicationCommandType } from 'discord.js';
import { BOT } from ".";
import commands from "./commands";
import config from "./config";

export default function () {
    for (const guild in config) {
        const commandList = BOT.guilds.cache.get(guild)?.commands;
        if (!commandList) continue;

        for (const name in commands) {
            try {
                const { description } = commands[name];
                commandList.create(description ?? {
                    name,
                    type: ApplicationCommandType.Message
                } satisfies ApplicationCommandDataResolvable);
            } catch (err) {
                console.error(`Command failed to upload: ${name}\n${err}`);
            }
        }
    }
}
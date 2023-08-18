import { BOT } from ".";
import commands from "./commands";
import config from "./config";

export default function () {
    for (const guild in config) {
        const commandList = BOT.guilds.cache.get(guild)?.commands;
        if (!commandList) continue;

        for (const command in commands) {
            try {
                const { description } = commands[command];
                commandList.create(description ?? { name: command });
            } catch (err) {
                console.error(`Command failed to upload: ${command}\n${err}`)
            }
        }
    }
}
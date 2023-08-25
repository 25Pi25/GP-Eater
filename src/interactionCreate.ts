import { Interaction } from "discord.js";
import commands from "./commands";

export default function (interaction: Interaction) {
    // TODO: make use cases for other interaction types
    if (!interaction.isChatInputCommand()) return;
    const command = commands[interaction.commandName];
    command?.default(interaction);
}
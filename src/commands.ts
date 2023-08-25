import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import * as ping from "./chatCommands/ping";
import * as wordbomb from "./chatCommands/wordBomb/wordBomb";

export default {
    ping,
    wordbomb
} satisfies CommandModule as CommandModule;

interface CommandModule {
    [key: string]: {
        default: (interaction: ChatInputCommandInteraction) => void,
        description?: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    }
}
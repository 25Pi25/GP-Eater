import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import * as ping from "./commands/ping";

export default {
    ping
} satisfies {
    [key: string]: {
        default: (interaction: ChatInputCommandInteraction) => void,
        description?: SlashCommandBuilder
    }
};
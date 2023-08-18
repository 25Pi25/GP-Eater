import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export const description = new SlashCommandBuilder()
    .setName('ping')
    .setDescription("Return a pong.")

export default async (interaction: ChatInputCommandInteraction) =>
    await interaction.reply("Pong!");
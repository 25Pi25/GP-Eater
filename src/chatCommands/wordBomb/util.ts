import { APIEmbedField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Colors, EmbedBuilder, User } from 'discord.js';

export const getPlayersField = (players: User[]): APIEmbedField =>
    ({ name: 'Players', value: players.map(({ id }, i) => `<@${id}>${!i ? " (VIP)" : ""}`).join("\n") || "none" });

export const wordBombEmbed = (interaction: ChatInputCommandInteraction, lives: number, minTime: number, players: User[]) =>
    new EmbedBuilder()
        .setTitle("Starting a game of Word Bomb!")
        .setDescription("How do you play Word Bomb?")
        .setColor(Colors.DarkGreen)
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp()
        .addFields(
            { name: 'Goal', value: "Try to survive as long as possible by correctly providing a word that fits the game's prompt." },
            { name: 'How to Play', value: "When it's your turn, you have a set amount of time to say a unique word that fits the prompt given to you. You get 3 points per letter, and double that if all your letters are unique (decreases for each repeated letter). Having a point lead will give you easier prompts, and being behind in points will give much harder ones." },
            { name: 'Settings', value: `Lives: ${lives}\nMinimum time: ${minTime}` },
            getPlayersField(players)
        );

export const lobbyButtons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('join')
            .setLabel('Join!')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('start')
            .setLabel('Start Game (VIP)')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('abort')
            .setLabel('Abort (VIP)')
            .setStyle(ButtonStyle.Danger),
    );

export const wordFrequency = {
    a: 64,
    b: 14,
    c: 27.2,
    d: 32.4,
    e: 96,
    f: 14.4,
    g: 20,
    h: 33.6,
    i: 62.4,
    j: 1.44,
    k: 6.96,
    l: 37.2,
    m: 20.4,
    n: 55.6,
    o: 54.4,
    p: 18.8,
    q: 1.14,
    r: 53.2,
    s: 60,
    t: 63.2,
    u: 24.4,
    v: 7.92,
    w: 13.24,
    x: 1.68,
    y: 14.4,
    z: 2.056
}
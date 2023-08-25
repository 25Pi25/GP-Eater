import { ChatInputCommandInteraction, Colors, EmbedBuilder, Message, SlashCommandBuilder, User } from 'discord.js';
import { clamp, sleep } from '../../util';
import { wordBombEmbed, lobbyButtons, getPlayersField, wordFrequency } from './util';

export const description = new SlashCommandBuilder()
    .setName('wordbomb')
    .setDescription("Start a game of Word Bomb.")
    .addNumberOption(x => x
        .setName('lives')
        .setDescription("The amount of lives you start with. (1-5, default 3)")
    )
    .addNumberOption(x => x
        .setName('mintime')
        .setDescription("The minimum amount of time allowed to respond to a prompt. (3-20, default 5)")
    );

export default async function (interaction: ChatInputCommandInteraction) {
    const { options } = interaction;
    const lives = clamp(1, options.getNumber('lives')?.valueOf() ?? 3, 5);
    const minTime = clamp(3, options.getNumber('mintime')?.valueOf() ?? 5, 20);
    await openLobby(interaction, lives, minTime);
}

async function openLobby(interaction: ChatInputCommandInteraction, lives: number, minTime: number) {
    let players = [interaction.user];
    const embed = wordBombEmbed(interaction, lives, minTime, players);
    const lobbyMessage = await interaction.reply({
        embeds: [embed],
        components: [lobbyButtons]
    });

    const collector = lobbyMessage.createMessageComponentCollector({ time: 300_000 });
    collector.on('collect', async collection => {
        const { customId, user, user: { id } } = collection;
        switch (customId) {
            case 'join':
                const wasInPlayers = !players.includes(user);
                if (wasInPlayers) players.push(user);
                else players = players.filter(player => player.id != id);
                embed.spliceFields(3, 1, getPlayersField(players));
                await interaction.editReply({ embeds: [embed] }).catch(console.error);
                await collection.reply({ content: `\`You have successfully ${wasInPlayers ? "joined" : "left"}.\``, ephemeral: true });
                break;
            case 'abort':
                if (players[0].id != id) {
                    collection.reply({
                        content: "`You need to be the VIP to abort the game!`",
                        ephemeral: true
                    });
                    return;
                }
                collection.deferUpdate();
                collector.stop();
                break;
            case 'start':
                if (players[0].id != id) {
                    collection.reply({
                        content: "`You need to be the VIP to start the game!`",
                        ephemeral: true
                    });
                    return;
                }
                const wordBombPlayers = players.map(player => WordBombGame.makeNewPlayer(player, lives))
                new WordBombGame(interaction, wordBombPlayers, lives, minTime).startGame();
                collection.deferUpdate();
                collector.stop();
        }
    });
    collector.on('end', async () => await interaction.deleteReply().catch(console.error));
}

interface WordBombPlayer {
    user: User
    lives: number
    score: number
    guess?: string
}
class WordBombGame {
    usedWords: string[] = [];
    round = 0;
    singlePlayer: boolean;
    prompts: { prompt: string, rarity: number }[] = [];
    constructor(
        private interaction: ChatInputCommandInteraction,
        private players: WordBombPlayer[],
        private lives: number,
        private minTime: number
    ) {
        this.singlePlayer = players.length == 1;
    }
    private get alivePlayers() {
        return this.players.filter(({ lives }) => lives);
    }
    private get time() {
        return this.minTime + Math.max(5 - (0.5 * (this.round - 1)), 0);
    }

    public static makeNewPlayer(user: User, lives: number): WordBombPlayer {
        return {
            user,
            lives,
            score: 0
        }
    }

    wordTrim(str: string) {
        return str.split("").filter(char => /[a-zA-Z]/.test(char)).join("").toLowerCase();
    }

    async startGame() {
        await this.interaction.channel.send(`\`Starting the game with ${this.players.length} player(s)!\``).catch(() => { });
        await this.nextRound();
    }

    async nextRound() {
        await this.interaction.channel.send(`\`Round ${++this.round} (Time: ${this.time}s)\``).catch(() => { });
        await sleep(1000);

        for (const player of this.alivePlayers) {
            await this.playRound(player);
            if (this.alivePlayers.length > (this.singlePlayer ? 0 : 1)) continue;
            this.endGame();
            return;
        }
        await this.interaction.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Round ${this.round} Over!`)
                    .setColor(Colors.DarkGreen)
                    .setDescription([...this.players]
                        .sort((a, b) => b.score - a.score)
                        .map(({ user: { tag }, score, lives, guess }) =>
                            `${tag}: ${lives ? `${guess || "N/A"} (${score} pts, ${lives} lives)` : "❌"}`)
                        .join("\n")
                    )
            ]
        }).catch(() => { });
        this.players.sort((a, b) => b.score - a.score);
        await sleep(3000);
        await this.nextRound();
    }

    async playRound(player: WordBombPlayer) {
        const { user: { id }, lives, score } = player;
        delete player.guess;
        const prompt = await this.getNewPrompt(player); //TODO: randomly generate this
        await this.interaction.channel.send(`<@${id}>, type a word containing \`${prompt}\``);

        const collector = this.interaction.channel.createMessageCollector({
            filter: message => message.author.id == player.user.id,
            time: this.time * 1000
        })

        let pendingChecks = 0;
        let guessWord = "";
        collector.on('collect', async collection => {
            pendingChecks++;
            if (await this.filterWord(collection, prompt)) {
                guessWord = this.wordTrim(collection.content);
                collector.stop();
            }
            pendingChecks--;
        })
        // Wait for the collector to end AND pending checks to finish
        await new Promise(res => collector.on('end', res));
        await new Promise<void>(async res => {
            while (pendingChecks) await sleep(100);
            res();
        });

        if (guessWord) {
            const rarityAverage = 100 - guessWord.split("").reduce((a, b) => a + wordFrequency[b], 0) / guessWord.length;
            player.guess = guessWord;
            this.usedWords.push(guessWord);
            // Rarity average 0-25, Guess score 5 * length
            player.score += Math.floor(rarityAverage / 4 + guessWord.length * 5);
            return;
        }
        await this.interaction.channel.send("💥 `You ran out of time!`").catch(() => { });
        if (--player.lives) return;
        await this.interaction.channel.send(`\`You have been eliminated! ${this.alivePlayers.length > 2 ? "All other players' scores have been reset." : ""}\``).catch(() => { });
    }

    async filterWord(message: Message, prompt: string): Promise<boolean> {
        const { content } = message;
        const trimmedContent = this.wordTrim(content);
        if (!trimmedContent.includes(prompt.toLowerCase())) return false;
        if (this.usedWords.includes(trimmedContent)) {
            await message.react("🔒").catch(() => { });
            return false;
        }
        if (!await WordBombGame.isRealWord(trimmedContent)) {
            await message.react("❌").catch(() => { });
            return false;
        }
        message.react("✅").catch(() => { });
        return true;
    }

    static async isRealWord(word: string): Promise<boolean> {
        return (await fetch(`https://www.dictionary.com/browse/${word}`)).ok;
    }

    async getNewPrompt(player: WordBombPlayer) {
        if (this.prompts.length < 15) await this.addNewWords();
        const [firstPlayer, ...alivePlayers] = this.alivePlayers;
        const percentile = (firstPlayer.score - player.score) / (firstPlayer.score - alivePlayers[alivePlayers.length - 1].score)
        const boxedPercentile = clamp(Math.max(0, 0.5 - this.round * 0.05), percentile, Math.max(0.1, 1 - this.round * 0.05))
        const promptIndex = Math.floor(boxedPercentile * this.prompts.length);
        const promptInfo = this.prompts.splice(promptIndex, 1);
        return promptInfo[0].prompt;
    }

    async addNewWords() {
        const wordData = await fetch("https://random-word-api.herokuapp.com/word?length=9&number=3").catch(() => { });
        if (!wordData) return;
        const words = await wordData.json() as string[];
        for (const word of words) {
            for (let i = 0; i < word.length - 2; i++) {
                for (const promptPair of [word.substring(i, i + 2), word.substring(i, i + 3)]) {
                    if (this.prompts.some(({ prompt }) => prompt == promptPair)) continue;
                    const rarity = promptPair.split("").reduce((a, b) => a + wordFrequency[b] ?? 0, 0) / (2 * promptPair.length);
                    this.prompts.push({ prompt: promptPair, rarity })
                }
            }
        }
        this.prompts.sort((a, b) => a.rarity - b.rarity);
    }

    async endGame() {
        await this.interaction.channel.send(`Game Over! ${this.alivePlayers.length ? `<@${this.alivePlayers[0].user.id}>` : "No one"} wins!`).catch(() => { });
    }
}
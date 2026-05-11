import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getBrainTop10ByIq, getBrainTop10ByLevel, getBrainTop10ByNeuron } from '../modules/brain/brain.service';
import { Table } from 'embed-table';


export const data = new SlashCommandBuilder()
    .setName('랭킹-두뇌')
    .setDescription('두뇌 랭킹 정보를 조회합니다.')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('iq-랭킹')
            .setDescription('IQ 랭킹 TOP 10명을 조회합니다.')
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('뉴런-랭킹')
            .setDescription('뉴런 랭킹 TOP 10명을 조회합니다.')
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('레벨-랭킹')
            .setDescription('레벨 랭킹 TOP 10명을 조회합니다.')
    )

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // 서버가 없는 DM에서는 작동하지 않음
    if (!interaction.guild) {
        await interaction.reply({ content: '이 명령어는 서버에서만 사용할 수 있습니다.', ephemeral: true });
        return;
    }
    const guildId = interaction.guildId!;

    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand == 'iq-랭킹') {
        const iqTop10List = await getBrainTop10ByIq(guildId);
        const table = new Table({
            titles: ['순위', 'IQ', '유저명'],
            titleIndexes: [0, 6, 25],
            columnIndexes: [0, 5, 13],
            start: '`',
            end: '',
            padEnd: 2
        });

        //console.log(iqTop10List);

        let i = 1;
        iqTop10List.forEach(e => {
            table.addRow([i + '', e.brIq + '', '`<@' + e.discordUserId + '>'], { override: 4});
            i++;
        });

        let top1user = await interaction.client.users.fetch(iqTop10List[0].discordUserId);

        const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('🏅 IQ 랭킹')
        .setDescription('서버 내 상위 10명만 출력됩니다.')
        .setThumbnail(top1user?.displayAvatarURL() || '')
        .setFooter({
            text: `요청자: ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
        });

        embed.setFields(table.toField());
        // flags: [4096] >> @silent 
        await interaction.reply({ 
            embeds: [embed], 
            //flags: [4096] 
        });
    }
    if (subcommand == '뉴런-랭킹') {
        const iqTop10List = await getBrainTop10ByNeuron(guildId);
        const table = new Table({
            titles: ['순위', '뉴런', '유저명'],
            titleIndexes: [0, 6, 22],
            columnIndexes: [0, 5, 13],
            start: '`',
            end: '',
            padEnd: 2
        });

        //console.log(iqTop10List);

        let i = 1;
        iqTop10List.forEach(e => {
            table.addRow([i + '', '★' + e.brNeuronLv , '`<@' + e.discordUserId + '>'], { override: 4});
            i++;
        });

        let top1user = await interaction.client.users.fetch(iqTop10List[0].discordUserId);

        const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('🏅 뉴런 랭킹')
        .setDescription('서버 내 상위 10명만 출력됩니다.')
        .setThumbnail(top1user?.displayAvatarURL() || '')
        .setFooter({
            text: `요청자: ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
        });

        embed.setFields(table.toField());
        // flags: [4096] >> @silent 
        await interaction.reply({ 
            embeds: [embed], 
            //flags: [4096] 
        });
    }
    if (subcommand == '레벨-랭킹') {
        const iqTop10List = await getBrainTop10ByLevel(guildId);
        const table = new Table({
            titles: ['순위', '레벨', '유저명'],
            titleIndexes: [0, 6, 20],
            columnIndexes: [0, 5, 13],
            start: '`',
            end: '',
            padEnd: 2
        });

        //console.log(iqTop10List);

        let i = 1;
        iqTop10List.forEach(e => {
            table.addRow([i + '', 'Lv.' + e.brLv, '`<@' + e.discordUserId + '>'], { override: 4});
            i++;
        });

        let top1user = await interaction.client.users.fetch(iqTop10List[0].discordUserId);

        const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('🏅 레벨 랭킹')
        .setDescription('서버 내 상위 10명만 출력됩니다.')
        .setThumbnail(top1user?.displayAvatarURL() || '')
        .setFooter({
            text: `요청자: ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
        });

        embed.setFields(table.toField());
        // flags: [4096] >> @silent 
        await interaction.reply({ 
            embeds: [embed], 
            //flags: [4096] 
        });
    }
}
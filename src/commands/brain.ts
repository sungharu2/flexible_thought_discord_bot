import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, roleMention, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { changeIq, getBrain, getIq } from '../modules/brain/brain.service';
import { getPotentialData, printPotential, rerollPotential } from '../brain_upgrade/upgrade.potential';
import { getNeuronDataByLv, printNeuronUI, upgradeNeuron } from '../brain_upgrade/upgrade.neuron';
import { Brain } from '../modules/brain/brain.types';

export const data = new SlashCommandBuilder()
    .setName('두뇌')
    .setDescription('두뇌 정보를 확인하고 강화합니다.')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('정보-조회')
            .setDescription('나의 두뇌 정보를 확인합니다.')
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('레벨')
            .setDescription('진화하여 나의 두뇌 레벨을 강화하고 시냅스를 충전합니다.')
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('뉴런')
            .setDescription('뉴런의 지능 스탯을 강화합니다.')
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('잠재능력')
            .setDescription('두뇌의 잠재능력을 재설정합니다.')
    )

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();

    const userId = interaction.user.id;
    const brain = await getBrain(userId);

    if (!brain) {
        const embed = new EmbedBuilder()
        .setColor(0xffda00)
        .setTitle('🔍 봇 오류 발생')
        .setDescription('명령어 실행 중 오류가 발생했습니다! 에러코드: 203')
        .setFooter({
            text: `요청자: ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
        });

        await interaction.reply({ embeds: [embed] });
        return;
    }

    const level = brain.brLv;
    const synapse = brain.brSynapse;
    const neuronLv = brain.brNeuronLv;
    const potential = brain.brPotential;

    // IQ 계산 DB 저장
    await changeIq(brain);

    if (subcommand == '정보-조회') {
        const embed = new EmbedBuilder()
        .setColor(getColorByPotential(potential))
        .setTitle('🧠 두뇌 정보')
        .setDescription('이것이 당신의 두뇌입니다.')
        .setThumbnail(interaction.user?.displayAvatarURL() || '')

        embed.addFields(
            { name: '레벨', value: 'Lv. ' + level, inline: false },
            { name: '보유 시냅스', value: synapse + ' / 1000', inline: false },
            { name: 'IQ', value: getIq(brain), inline: false },
            { name: '뉴런', value: '**★ ' + neuronLv + '성**', inline: false },
            { name: '잠재능력', 
                value: printPotential(potential),
                inline: false 
            }
        );
        await interaction.reply({ embeds: [embed] });

    }
    if (subcommand == '레벨') {
        const embed = new EmbedBuilder()
        .setColor(getColorByPotential(potential))
        .setTitle('🧠 레벨 정보')
        .setDescription('뉴런을 강화할 수 있습니다.\n')
        .setThumbnail(interaction.user?.displayAvatarURL() || '')

        embed.addFields(
            { name: '레벨', 
                value: 'Lv. ' + level,
                inline: false 
            },
            { name: '시냅스', 
                value: synapse + ' / 1000',
                inline: false 
            },
        );

        // 진화 버튼
        const isEvolved = brain.brEvolved;
        const upgrade = new ButtonBuilder()
            .setCustomId('brain_evolve_' + userId)
            .setLabel(isEvolved ? '진화! (오늘 진화 완료)' : '진화! (매일 초기화)')
            .setStyle(ButtonStyle.Success)
            .setDisabled(isEvolved);
        const rowButton = new ActionRowBuilder<ButtonBuilder>().addComponents(upgrade);

        await interaction.reply({ 
            embeds: [embed], 
            components: [rowButton],
            withResponse: true,
        });
    }
    if (subcommand == '뉴런') {
        const embed = new EmbedBuilder()
        .setColor(getColorByPotential(potential))
        .setTitle('🧠 뉴런 정보')
        .setDescription('잔여 시냅스: ' + brain.brSynapse + ' / 1000\n')
        .setThumbnail(interaction.user?.displayAvatarURL() || '')

        embed.addFields(
            { name: '뉴런', 
                value: printNeuronUI(neuronLv),
                inline: false 
            }
        );

        // 강화 버튼
        const upgrade = new ButtonBuilder().setCustomId('upgrade_neuron_' + userId).setLabel('강화하기!').setStyle(ButtonStyle.Success);
        const rowButton = new ActionRowBuilder<ButtonBuilder>().addComponents(upgrade);

        await interaction.reply({ 
            embeds: [embed], 
            components: [rowButton],
            withResponse: true,
        });
    }
    if (subcommand == '잠재능력') {
        const embed = new EmbedBuilder()
        .setColor(getColorByPotential(potential))
        .setTitle('🧠 잠재능력 정보')
        .setDescription('잔여 시냅스: ' + brain.brSynapse + ' / 1000\n')
        .setThumbnail(interaction.user?.displayAvatarURL() || '')

        embed.addFields(
            { name: '잠재능력', 
                value: printPotential(potential),
                inline: false 
            }
        );

        // 강화 버튼
        const upgrade = new ButtonBuilder().setCustomId('upgrade_potential_' + userId).setLabel('재설정!').setStyle(ButtonStyle.Success);
        const rowButton = new ActionRowBuilder<ButtonBuilder>().addComponents(upgrade);

        await interaction.reply({ 
            embeds: [embed], 
            components: [rowButton],
            withResponse: true,
        });
    }

}

export function getColorByPotential(potential: string): number {
    const potentialType = potential.split('_')[0];

    // 레어
    if (potentialType == '1') {
        return 0x0099FF
    }
    // 에픽
    if (potentialType == '2') {
        return 0x4c00b0
    }
    // 유니크
    if (potentialType == '3') {
        return 0xffda03
    }
    // 레전드리
    if (potentialType == '4') {
        return 0x00ff00
    }
    return 0xffffff;
}

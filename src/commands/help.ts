import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('도움말을 표시합니다.')

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('📌 도움말')
        .setDescription('⏱️ 버전: v0.1 / 마지막 수정일: 2026-05-11')
        .setThumbnail(interaction.client.user?.displayAvatarURL() || '')
        .setTimestamp()
        .setFooter({
            text: `요청자: ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
        });
        addHelpEmbed(embed);

    await interaction.reply({ embeds: [embed] });
}

export async function addHelpEmbed(embed: EmbedBuilder) {
    embed.addFields(
        { name: '명령어 사용법', value: `'bot-##' 채널에서 '/' 슬래시를 입력하여 명령어를 사용할 수 있습니다.`, inline: false },
        { name: '명령어 예시', value: '/두뇌 정보-조회, /랭킹-두뇌 iq-랭킹', inline: false },
        { name: '명령어 설명', value: `
            두뇌: 자신의 두뇌 정보를 확인하고 강화할 수 있습니다.
            랭킹-두뇌: 현재 서버 내 인원들의 두뇌 랭킹을 조회합니다.`,
            inline: false },
        { name: '두뇌 강화 게임 설명', value: `
            \n- 두뇌 레벨: 기본 스탯이 되는 레벨입니다. 매일 수동으로 [진화]를 통해 정해진 확률에 따라 일정 수치만큼 올릴 수 있습니다.
            \n- 시냅스: 하루에 강화 가능한 횟수이며 1000개까지 저장됩니다. 매일 수동으로 [진화]를 통해 1000개를 충전할 수 있습니다.
            - ⚠️ [진화]는 하루 1회만 가능합니다. 시냅스가 남아있다면 1000개 이상 충전되지 않습니다.
            \n- IQ: 총합 스탯의 합산치를 나타냅니다.
            \n- 뉴런: ⭐0성부터 ⭐30성까지 강화할 수 있습니다.
            \n- 잠재능력: 레어/에픽/유니크/레전드리 4개의 등급이 있으며 3개의 잠재능력을 재설정할 수 있습니다. 
            - ⚠️ 현재 INT 스탯만 유효한 옵션입니다.`,
            inline: false },
        { name: '확률 공지 링크', value: 'https://www.notion.so/v0-1-359b765c49f980bd8fcfea1dbc286d7b?source=copy_link', inline: false },
        { name: '운영자 계좌', value: '**-> 토스뱅크 1000-1286-5583**\n후원 시 소정의 상품을 드립니다.', inline: false },
    );
}
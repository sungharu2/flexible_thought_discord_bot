import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('봇의 응답 속도를 확인합니다.');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sent = await interaction.reply({ content: '핑 측정 중...', fetchReply: true });
    const pingTime = sent.createdTimestamp - interaction.createdTimestamp;
    const apiPing = interaction.client.ws.ping;

    await interaction.editReply(`지연 시간: ${pingTime}ms | API 지연 시간: ${apiPing}ms`);
}
import { ChannelType, EmbedBuilder } from 'discord.js';
import { Guild } from 'discord.js';
import { config } from 'dotenv';

// .env 파일 로드
config();

/**
 * 봇 전용 채널을 생성하는 함수
 */
export async function initChannels(guild: Guild, avatarURL?: string) {
    let theChannel = null;
    let isChannelExists = false;

    //console.log((await guild.channels.fetch()).size)
    for (const channel of guild.channels.valueOf()) {

        // 이미 채널이 있는지 체크
        if (channel[1].name == `bot-두뇌강화`) {
            theChannel = channel[1]
            isChannelExists = true;
        }
    }

    // 채널이 없다면 채널 생성
    if (!isChannelExists) {
        theChannel = await guild.channels.create({
            name: `bot-두뇌강화`,
            type: ChannelType.GuildText
        });

        // 채널 생성 후 help 명령어 자동실행
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🔍 도움말')
            .setDescription('도움말을 표시합니다.')
            .setThumbnail(avatarURL || '')
            .setTimestamp();
    
        embed.addFields(
            { name: '명령어 사용법', value: '명령어를 입력하면 도움말을 표시합니다.', inline: false },
            { name: '명령어 예시', value: '/ping, /server', inline: false },
            { name: '명령어 설명', value: 'ping: 봇의 응답 속도를 확인합니다.\nserver: 서버 정보를 표시합니다.', inline: false }
        );
    
        await theChannel.send({ embeds: [embed] });
    }

}

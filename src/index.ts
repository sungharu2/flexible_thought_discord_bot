import { Client, Collection, GatewayIntentBits, Events, ClientEvents, ChatInputCommandInteraction } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { deployCommands } from "./deploy-commands";
import { initChannels } from './init-channels';

// .env 파일 로드
config();

// 클라이언트 인스턴스 생성
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

interface Command {
    data: {
        name: string;
    };
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

// 명령어를 저장할 컬렉션
const commands = new Collection<string, Command>();

// 명령어 파일 로드
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    import(filePath).then((command) => {
        if ('data' in command && 'execute' in command) {
            commands.set(command.data.name, command);
        } else {
            console.warn(`${filePath} 명령어에 필요한 "data" 또는 "execute" 속성이 없습니다.`);
        }
    });
}

// 이벤트 파일 로드
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    import(filePath).then((event) => {
        if (event.once) {
            client.once(event.name as keyof ClientEvents, (...args) => event.execute(...args));
        } else {
            client.on(event.name as keyof ClientEvents, (...args) => event.execute(...args));
        }
    });
}

// 상호작용 이벤트 처리
client.on(Events.InteractionCreate, async interaction => {
    console.log(`상호작용 발생: ${interaction.user.tag} (${interaction.user.id})`);
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) {
        console.error(`${interaction.commandName} 명령어를 찾을 수 없습니다.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`명령어 실행 중 오류 발생:`, error);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: '명령어 실행 중 오류가 발생했습니다!',
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: '명령어 실행 중 오류가 발생했습니다!',
                ephemeral: true
            });
        }
    }
});

// 봇 로그인
client.login(process.env.TOKEN).catch(error => {
    console.error('봇 로그인 오류:', error);
    process.exit(1);
});

// 준비 완료 이벤트
client.once(Events.ClientReady, () => {
    console.log(`${client.user?.tag}으로 로그인 성공!`);
    console.log(`봇이 ${client.guilds.cache.size}개의 서버에서 실행 중`);


    for (const guild of client.guilds.cache.values()) {
        try {
            deployCommands();
            // bot-두뇌강화 채널 init 설정
            initChannels(guild, client.user?.displayAvatarURL());
        } catch (error) {
            console.error(`${guild.name}(${guild.id}) 서버에서 명령어 배포 실패:`, error);
        }
    }

    // 봇 상태 설정
    client.user?.setPresence({
        activities: [{ name: '/help 명령어로 도움말 보기', type: 3 }],
        status: 'online',
    });
});

// 프로세스 에러 처리
process.on('unhandledRejection', (error) => {
    console.error('처리되지 않은 Promise 거부:', error);
});

// commands 컬렉션 내보내기 (다른 파일에서 명령어 목록에 접근할 수 있도록)
export { commands };
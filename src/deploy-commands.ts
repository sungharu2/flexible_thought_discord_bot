import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// .env 파일 로드
config();

/**
 * 슬래시 명령어를 Discord API에 등록하는 함수
 * @param options 옵션 객체 (선택적)
 * @param options.guildId 서버 전용 명령어 등록을 위한 서버 ID (선택적)
 * @param options.global 전역 명령어 등록 여부 (기본값: true)
 */
export async function deployCommands(options: { guildId?: string; global?: boolean } = {}) {
    const { guildId, global = true } = options;

    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

    // 명령어 로드
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await import(filePath);

        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.warn(`${filePath} 명령어에 필요한 "data" 또는 "execute" 속성이 없습니다.`);
        }
    }

    // REST API 인스턴스 생성
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || '');

    try {
        console.log(`${commands.length}개의 슬래시 명령어를 등록 중...`);

        // 전역 명령어 등록 (global이 true일 때)
        if (global) {
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID || ''),
                { body: commands },
            );
            console.log('전역 슬래시 명령어 등록 완료!');
        }

        return true;
    } catch (error) {
        console.error('명령어 등록 중 오류 발생:', error);
        return false;
    }
}

// 직접 실행될 때 자동으로 명령어 배포 실행
if (require.main === module) {
    deployCommands().catch(error => {
        console.error('명령어 배포 실패:', error);
        process.exit(1);
    });
}
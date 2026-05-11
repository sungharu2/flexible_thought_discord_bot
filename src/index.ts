import { Client, Collection, GatewayIntentBits, Events, ClientEvents, ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { deployCommands } from "./deploy-commands";
import { initChannels } from './init-channels';
import { getUser, insertNewUser } from './modules/user/user.service';
import { changeNeuron, changePotential, getBrain, insertNewBrain } from './modules/brain/brain.service';
import { printPotential, rerollPotential } from './brain_upgrade/upgrade.potential';
import { getColorByPotential } from './commands/brain';
import { printNeuronUI, upgradeNeuron } from './brain_upgrade/upgrade.neuron';
import { insertNewUserMap } from './modules/user_server_map/usermap.service';

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

    // 유저-서버 맵 정보 저장
    if (interaction.guildId) {
        insertNewUserMap(interaction.user.id, interaction.guildId);
    }

    // 채팅 명령어 상호작용
    if (interaction.isChatInputCommand()) {
        // 신규 유저 정보 추가
        const userId = interaction.user.id;
        insertNewUser(userId);
        insertNewBrain(userId);

        const command = commands.get(interaction.commandName);

        if (!command) {
            console.error(`${interaction.commandName} 명령어를 찾을 수 없습니다.`);
            return;
        }

        const channel = interaction.channel
        // 'help'를 제외한 명령어는 bot-#### 채널에서만 실행되도록
        if (channel != null) {
            let channelName = ''
            try {
                interface TempChannel {
                    name: string;
                }
                channelName = (channel.toJSON() as TempChannel).name
                //console.log(channelName)
            }
            catch (error) {
                console.error("Invalid JSON format", error);
            }
            if (command.data.name != 'help' && !channelName.includes('bot-')) {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: `/help 명령어를 제외한 명령어는 'bot-####' 봇 전용 채널에서만 사용 가능합니다. 전용 채널에서 명령어를 호출해 주세요.`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `/help 명령어를 제외한 명령어는 'bot-####' 봇 전용 채널에서만 사용 가능합니다. 전용 채널에서 명령어를 호출해 주세요.`,
                        ephemeral: true
                    });
                }
                return;
            }
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`명령어 실행 중 오류 발생:`, error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: '명령어 실행 중 오류가 발생했습니다! 에러코드: 400',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '명령어 실행 중 오류가 발생했습니다! 에러코드: 400',
                    ephemeral: true
                });
            }
        }
    }
    // 버튼 상호작용
    if (interaction.isButton()) {
        // 뉴런 강화
        if (interaction.customId === 'upgrade_neuron') {
            const userId = interaction.user.id;
            const brain = await getBrain(userId);
            if (!brain)  {
                console.warn("뉴런 강화 오류 발생");
                return;
            }

            const potential = brain.brPotential;
            const neuronLv = brain.brNeuronLv;
            const newNeuronLv = upgradeNeuron(neuronLv);
            const isSuccess = neuronLv + 1 == newNeuronLv;
            const isDestroyed = neuronLv > 20 && newNeuronLv == 20;
            
            // DB 결과 저장
            changeNeuron(userId, neuronLv, newNeuronLv);

            const embed = new EmbedBuilder()
            .setColor(getColorByPotential(potential))
            .setTitle('🔍 뉴런 정보')
            .setDescription(isSuccess ? '뉴런 강화 성공!\n' : (isDestroyed ? '뉴런이 파괴되어 20성으로 손상되었습니다...\n' : '뉴런 강화 실패...\n'))
            .setThumbnail(isSuccess ? interaction.client.user?.displayAvatarURL() || '' : interaction.user?.displayAvatarURL() || '')
            .setFooter({
                text: `요청자: ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            });
    
            embed.addFields(
                { name: '뉴런', 
                    value: printNeuronUI(newNeuronLv),
                    inline: false 
                }
            );
    
            // 강화 버튼
            const upgrade = new ButtonBuilder().setCustomId('upgrade_neuron').setLabel('강화하기!').setStyle(ButtonStyle.Success);
            const rowButton = new ActionRowBuilder<ButtonBuilder>().addComponents(upgrade);
    
            await interaction.update({ 
                embeds: [embed], 
                components: [rowButton],
            });
        }
        // 잠재능력 재설정
        if (interaction.customId === 'upgrade_potential') {
            const userId = interaction.user.id;
            const brain = await getBrain(userId);
            if (!brain)  {
                console.warn("잠재능력 재설정 오류 발생");
                return;
            }
            const potential = brain.brPotential;
            const newPotential = rerollPotential(potential);
            const isPromoted = potential.split('_')[0] != newPotential.split('_')[0];
            
            // DB 결과 저장
            changePotential(userId, potential, newPotential);

            const embed = new EmbedBuilder()
            .setColor(getColorByPotential(newPotential))
            .setTitle('🔍 잠재능력 정보')
            .setDescription(isPromoted ? '★★잠재능력 등급 상승!★★\n' : '잠재능력 재설정 완료!\n')
            .setThumbnail(isPromoted ? interaction.client.user?.displayAvatarURL() || '' : interaction.user?.displayAvatarURL() || '')
            .setFooter({
                text: `요청자: ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            });
    
            embed.addFields(
                { name: '잠재능력', 
                    value: printPotential(newPotential),
                    inline: false 
                }
            );
    
            // 강화 버튼
            const upgrade = new ButtonBuilder().setCustomId('upgrade_potential').setLabel('재설정!').setStyle(ButtonStyle.Success);
            const rowButton = new ActionRowBuilder<ButtonBuilder>().addComponents(upgrade);
    
            await interaction.update({ 
                embeds: [embed], 
                components: [rowButton],
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
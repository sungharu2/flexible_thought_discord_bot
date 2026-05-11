import { Client, Collection, GatewayIntentBits, Events, ClientEvents, ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, LabelBuilder } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { deployCommands } from "./deploy-commands";
import { initChannels } from './init-channels';
import { getUser, insertNewUser } from './modules/user/user.service';
import { changeNeuron, changePotential, evolveBrain, getBrain, insertNewBrain, resetIsEvolvedFalse } from './modules/brain/brain.service';
import { printPotential, rerollPotential } from './brain_upgrade/upgrade.potential';
import { getColorByPotential } from './commands/brain';
import { printNeuronUI, upgradeNeuron } from './brain_upgrade/upgrade.neuron';
import { insertNewUserMap } from './modules/user_server_map/usermap.service';
import nodeCron from 'node-cron';

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
        // 진화
        if (interaction.customId === 'brain_evolve') {
            const userId = interaction.user.id;
            let brain = await getBrain(userId);
            if (!brain)  {
                console.warn("진화 처리 중 오류 발생");
                return;
            }

            const potential = brain.brPotential;
            const level = brain.brLv;
            
            // 진화
            if (!brain.brEvolved) {
                await evolveBrain(userId, level);
                const newBrain = await getBrain(userId);
                if (newBrain) {
                    brain = newBrain;
                }
            }

            const embed = new EmbedBuilder()
            .setColor(getColorByPotential(potential))
            .setTitle('🧠 레벨 정보')
            .setDescription('오늘 진화를 완료했습니다!\n')
            .setThumbnail(interaction.user?.displayAvatarURL() || '')
    
            embed.addFields(
                { name: '레벨', 
                    value: 'Lv. ' + brain.brLv,
                    inline: false 
                },
                { name: '시냅스', 
                    value: '1000 / 1000',
                    inline: false 
                },
            );
            
            // 진화 버튼
            const isEvolved = brain.brEvolved;
            const upgrade = new ButtonBuilder()
                .setCustomId('brain_evolve')
                .setLabel(isEvolved ? '진화! (오늘 진화 완료)' : '진화! (매일 초기화)')
                .setStyle(ButtonStyle.Success)
                .setDisabled(isEvolved);
            const rowButton = new ActionRowBuilder<ButtonBuilder>().addComponents(upgrade);
    
            await interaction.update({ 
                embeds: [embed], 
                components: [rowButton],
            });
        }
        // 뉴런 강화
        if (interaction.customId === 'upgrade_neuron') {
            const userId = interaction.user.id;
            const brain = await getBrain(userId);
            if (!brain)  {
                console.warn("뉴런 강화 오류 발생");
                return;
            }
            const synapse = brain.brSynapse;
            const potential = brain.brPotential;
            const neuronLv = brain.brNeuronLv;

            // 시냅스 모두 사용
            if (synapse <= 0) {
                const embed = new EmbedBuilder()
                .setColor(getColorByPotential(potential))
                .setTitle('🔍 뉴런 정보')
                .setDescription('오늘 모든 시냅스를 사용했습니다.\n내일 다시 두뇌-레벨 메뉴의 [진화]를 통해 시냅스를 충전하세요!\n')
                .setThumbnail(interaction.user?.displayAvatarURL() || '')
                .setFooter({
                    text: `요청자: ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });
        
                embed.addFields(
                    { name: '뉴런', 
                        value: printNeuronUI(neuronLv),
                        inline: false 
                    }
                );
                // 강화 버튼
                const upgrade = new ButtonBuilder().setCustomId('upgrade_neuron').setLabel('강화하기!').setStyle(ButtonStyle.Success).setDisabled(true);
                const rowButton = new ActionRowBuilder<ButtonBuilder>().addComponents(upgrade);
        
                await interaction.update({ 
                    embeds: [embed], 
                    components: [rowButton],
                });
                return;
            }

            const newNeuronLv = upgradeNeuron(neuronLv);
            const isSuccess = neuronLv + 1 == newNeuronLv;
            const isDestroyed = neuronLv > 20 && newNeuronLv == 20;

            // DB 결과 저장
            const result = changeNeuron(userId, neuronLv, newNeuronLv, synapse);
            // DB 작업 실패 시
            if (!result) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🔍 잠재능력 정보')
                    .setDescription('내부 처리 중 오류가 발생했습니다. 같은 현상이 계속 발생한다면 관리자에게 문의하세요. 오류 코드: 203\n')
                    .setThumbnail(interaction.user?.displayAvatarURL() || '')
                    .setFooter({
                        text: `요청자: ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL()
                    });
            
                    interaction.update({ 
                        embeds: [embed],
                });
                return;
            }

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
            const synapse = brain.brSynapse;
            const potential = brain.brPotential;

            // 시냅스 모두 사용
            if (synapse <= 0) {
                const embed = new EmbedBuilder()
                .setColor(getColorByPotential(potential))
                .setTitle('🔍 잠재능력 정보')
                .setDescription('오늘 모든 시냅스를 사용했습니다.\n내일 다시 두뇌-레벨 메뉴의 [진화]를 통해 시냅스를 충전하세요!\n')
                .setThumbnail(interaction.user?.displayAvatarURL() || '')
                .setFooter({
                    text: `요청자: ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

                embed.addFields(
                    { name: '잠재능력', 
                        value: printPotential(potential),
                        inline: false 
                    }
                );
                // 강화 버튼
                const upgrade = new ButtonBuilder().setCustomId('upgrade_neuron').setLabel('강화하기!').setStyle(ButtonStyle.Success).setDisabled(true);
                const rowButton = new ActionRowBuilder<ButtonBuilder>().addComponents(upgrade);
        
                await interaction.update({ 
                    embeds: [embed], 
                    components: [rowButton],
                });
                return;
            }

            const newPotential = rerollPotential(potential);
            const isPromoted = potential.split('_')[0] != newPotential.split('_')[0];

            // DB 결과 저장
            const result = changePotential(userId, potential, newPotential, synapse);
            // DB 작업 실패 시
            if (!result) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🔍 잠재능력 정보')
                    .setDescription('내부 처리 중 오류가 발생했습니다. 같은 현상이 계속 발생한다면 관리자에게 문의하세요. 오류 코드: 203\n')
                    .setThumbnail(interaction.user?.displayAvatarURL() || '')
                    .setFooter({
                        text: `요청자: ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL()
                    });
            
                    interaction.update({ 
                        embeds: [embed],
                });
                return;
            }

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

// 매일 00시 진화 가능 여부 초기화
nodeCron.schedule('0 0 * * *', function() {
    resetIsEvolvedFalse();
    console.log('crontab schedule: reset isEvolved complete.');
})

// commands 컬렉션 내보내기 (다른 파일에서 명령어 목록에 접근할 수 있도록)
export { commands };
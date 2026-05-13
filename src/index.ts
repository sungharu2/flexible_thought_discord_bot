import { Client, Collection, GatewayIntentBits, Events, ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ModalBuilder, LabelBuilder, TextChannel } from 'discord.js';
import type { ClientEvents } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { deployCommands } from "./deploy-commands.js";
import { initChannels } from './init-channels.js';
import { insertNewUser } from './modules/user/user.service.js';
import { changeIq, changeLeftRightUpgrade, changeNeuron, changePotential, equipLeftRight, evolveBrain, getBrain, insertNewBrain, resetIsEvolvedFalse, resetLeftRightUpgrade } from './modules/brain/brain.service.js';
import { printPotential, rerollPotential } from './brain_upgrade/upgrade.potential.js';
import { getColorByPotential } from './commands/brain.js';
import { printNeuronUI, upgradeNeuron } from './brain_upgrade/upgrade.neuron.js';
import { insertNewUserMap } from './modules/user_server_map/usermap.service.js';
import nodeCron from 'node-cron';

import { fileURLToPath, pathToFileURL } from 'url';
import { LeftRight, upgradeLeftRight } from './brain_upgrade/upgrade.leftright.js';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 명령어 폴더
const commandsPath = path.join(__dirname, 'commands');

// dist 기준이면 .js 권장
const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith('.js') || file.endsWith('.ts') );

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    // Windows ESM 대응
    const fileUrl = pathToFileURL(filePath).href;
    const command = await import(fileUrl);

    if ('data' in command && 'execute' in command) {
        commands.set(command.data.name, command);
    } else {
        console.warn(
        `${filePath} 명령어에 필요한 "data" 또는 "execute" 속성이 없습니다.`
        );
    }
}

// 이벤트 파일 로드
// const eventsPath = pathToFileURL(path.resolve('../events')).href;
// const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

// for (const file of eventFiles) {
//     const filePath = file;
//     import(filePath).then((event) => {
//         if (event.once) {
//             client.once(event.name as keyof ClientEvents, (...args) => event.execute(...args));
//         } else {
//             client.on(event.name as keyof ClientEvents, (...args) => event.execute(...args));
//         }
//     });
// }

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
        // 버튼 상호작용 예외처리
        try {
            const userId = interaction.user.id;
            // 타인의 메시지 상호작용 시
            //console.log('interaction.customId: ' + interaction.customId);
            if (!interaction.customId.includes(interaction.user.id)) {
                return;
            }

            // 진화
            if (interaction.customId.includes('brain_evolve')) {
                let brain = await getBrain(userId);
                if (!brain)  {
                    console.warn("진화 처리 중 오류 발생");
                    return;
                }
                
                const level = brain.brLv;
                const potential = brain.brPotential;
                // 진화
                if (!brain.brEvolved) {
                    await evolveBrain(userId, level);
                    const newBrain = await getBrain(userId);
                    if (newBrain) {
                        brain = newBrain;
                    }
                }
                
                // IQ 계산 DB 저장
                await changeIq(brain);

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
                    .setCustomId('brain_evolve_' + userId)
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
            if (interaction.customId.includes('upgrade_neuron')) {
                let brain = await getBrain(userId);
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
                    const upgrade = new ButtonBuilder().setCustomId('upgrade_neuron_' + userId).setLabel('강화하기!').setStyle(ButtonStyle.Success).setDisabled(true);
                    const rowButton = new ActionRowBuilder<ButtonBuilder>().addComponents(upgrade);
            
                    await interaction.update({ 
                        embeds: [embed], 
                        components: [rowButton],
                    });
                    return;
                }

                const newNeuronLv = upgradeNeuron(neuronLv);
                const isSuccess = neuronLv + 1 == newNeuronLv;
                const isDestroyed = neuronLv > 20 && newNeuronLv == 12;

                // DB 결과 저장
                const result = await changeNeuron(userId, neuronLv, newNeuronLv, synapse);
                // IQ 계산 DB 저장
                const newBrain = await getBrain(userId);
                if (newBrain) {
                    brain = newBrain;
                }
                await changeIq(brain);
                // 25성 이상 강화 성공 시 채널 메시지 전송
                if (newNeuronLv >= 25) {
                    sendMessageOnChannel(interaction.channelId, '<@' + userId + '> 님이 뉴런 ⭐ ' + newNeuronLv + '성 강화에 성공하였습니다! 모두 축하해주세요!');
                }
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
                .setDescription('잔여 시냅스: ' + brain.brSynapse + ' / 1000\n' + 
                    (isSuccess ? '✅ 뉴런 강화 성공!\n' : (isDestroyed ? '💀 뉴런이 파괴되어 12성으로 손상되었습니다...\n' : '❌ 뉴런 강화 실패...\n')))
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
                const upgrade = new ButtonBuilder().setCustomId('upgrade_neuron_' + userId).setLabel('강화하기!').setStyle(ButtonStyle.Success);
                const rowButton = new ActionRowBuilder<ButtonBuilder>().addComponents(upgrade);
        
                await interaction.update({ 
                    embeds: [embed], 
                    components: [rowButton],
                });
            }
            // 잠재능력 재설정
            if (interaction.customId.includes('upgrade_potential')) {
                let brain = await getBrain(userId);
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
                    const upgrade = new ButtonBuilder().setCustomId('upgrade_potential_' + userId).setLabel('재설정!').setStyle(ButtonStyle.Success).setDisabled(true);
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
                const result = await changePotential(userId, potential, newPotential, synapse);
                // IQ 계산 DB 저장
                const newBrain = await getBrain(userId);
                if (newBrain) {
                    brain = newBrain;
                }
                await changeIq(brain);
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
                .setDescription('잔여 시냅스: ' + brain.brSynapse + ' / 1000\n' + 
                    (isPromoted ? '★★잠재능력 등급 상승!★★\n' : '잠재능력 재설정 완료!\n'))
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
                const upgrade = new ButtonBuilder().setCustomId('upgrade_potential_' + userId).setLabel('재설정!').setStyle(ButtonStyle.Success);
                const rowButton = new ActionRowBuilder<ButtonBuilder>().addComponents(upgrade);
        
                await interaction.update({ 
                    embeds: [embed], 
                    components: [rowButton],
                });
            }
            // 좌뇌 or 우뇌 활성화
            if (interaction.customId.includes('upgrade_left') || interaction.customId.includes('upgrade_right') || interaction.customId.includes('upgrade_overload')) {
                let brain = await getBrain(userId);
                if (!brain)  {
                    console.warn("좌우뇌 정보 오류 발생");
                    return;
                }

                const synapse = brain.brSynapse;
                const potential = brain.brPotential;
                const leftRightUpgrade = brain.brLeftRightUpgrade;
                let upgradeType = -1;
                if (interaction.customId.includes('upgrade_left')) {
                    upgradeType = 0;
                }
                if (interaction.customId.includes('upgrade_right')) {
                    upgradeType = 1;
                }
                if (interaction.customId.includes('upgrade_overload')) {
                    upgradeType = 2;
                }

                // 시냅스 모두 사용
                if (synapse <= 0) {
                    const embed = new EmbedBuilder()
                    .setColor(getColorByPotential(potential))
                    .setTitle('🧠 좌우뇌 정보')
                    .setDescription('오늘 모든 시냅스를 사용했습니다.\n내일 다시 두뇌-레벨 메뉴의 [진화]를 통해 시냅스를 충전하세요!\n')
                    .setThumbnail(interaction.user?.displayAvatarURL() || '')
                    .setFooter({
                        text: `요청자: ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL()
                    });

                    embed.addFields(
                        { name: '좌뇌' + leftRightUpgrade.printLeftRightInfo(0), 
                            value: leftRightUpgrade.printLeftRightUI(0),
                            inline: false 
                        },
                        { name: '우뇌' + leftRightUpgrade.printLeftRightInfo(1), 
                            value: leftRightUpgrade.printLeftRightUI(1),
                            inline: false 
                        },
                        { name: '과부하' + leftRightUpgrade.printLeftRightInfo(2), 
                            value: leftRightUpgrade.printLeftRightUI(2),
                            inline: false 
                        }
                    );
                    // 강화 버튼
                    const upgradeLeft = new ButtonBuilder().setCustomId('upgrade_left_' + userId).setLabel('좌뇌 활성화').setStyle(ButtonStyle.Success).setDisabled(true);
                    const upgradeRight = new ButtonBuilder().setCustomId('upgrade_right_' + userId).setLabel('우뇌 활성화').setStyle(ButtonStyle.Success).setDisabled(true);
                    const upgradeOverload = new ButtonBuilder().setCustomId('upgrade_overload_' + userId).setLabel('과부하 활성화').setStyle(ButtonStyle.Success).setDisabled(true);
                    // 초기화 버튼
                    const resetLeftRight = new ButtonBuilder().setCustomId('reset_left_right_' + userId).setLabel('초기화').setStyle(ButtonStyle.Danger).setDisabled(true);
                    const rowButtonUpgrade = new ActionRowBuilder<ButtonBuilder>().addComponents([upgradeLeft, upgradeRight, upgradeOverload]);
                    const rowButtonReset = new ActionRowBuilder<ButtonBuilder>().addComponents(resetLeftRight);
            
                    await interaction.update({ 
                        embeds: [embed], 
                        components: [rowButtonUpgrade, rowButtonReset],
                    });
                    return;
                }

                let result = false;
                // 좌우뇌 강화 DB 결과 저장
                const upgradedLeftRight = upgradeLeftRight(leftRightUpgrade, upgradeType);
                const newLeftRight = upgradedLeftRight[0];
                const upgradeResult = upgradedLeftRight[1];
                //console.log(upgradedLeftRight);
                
                // 잘못된 강화
                if (upgradeResult == null) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🧠 좌우뇌 정보')
                        .setDescription('내부 처리 중 오류가 발생했습니다. 같은 현상이 계속 발생한다면 관리자에게 문의하세요. 오류 코드: 400\n')
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
                result = await changeLeftRightUpgrade(userId, leftRightUpgrade, newLeftRight, synapse);
                // IQ 계산 DB 저장
                const newBrain = await getBrain(userId);
                if (newBrain) {
                    brain = newBrain;
                }
                await changeIq(brain);
                // DB 작업 실패 시
                if (!result) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🧠 좌우뇌 정보')
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

                const isSuccess = upgradeResult;
                
                let description = '';
                if (upgradeType == 0){
                    description = (isSuccess ? '좌뇌 활성화 성공!\n' : '좌뇌 활성화 실패..\n');
                }
                if (upgradeType == 1){
                    description = (isSuccess ? '우뇌 활성화 성공!\n' : '우뇌 활성화 실패..\n');
                }
                if (upgradeType == 2){
                    description = (isSuccess ? '과부하 활성화 성공!\n' : '과부하 활성화 실패..\n');
                }

                const embed = new EmbedBuilder()
                    .setColor(getColorByPotential(potential))
                    .setTitle('🧠 좌우뇌 정보')
                    .setDescription('잔여 시냅스: ' + brain.brSynapse + ' / 1000\n' + '활성화 확률: ' + newLeftRight.successRate + '%\n' + description)
                    .setThumbnail(isSuccess ? interaction.client.user?.displayAvatarURL() || '' : interaction.user?.displayAvatarURL() || '')
                    .setFooter({
                        text: `요청자: ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL()
                });
        
                embed.addFields(
                    { name: '좌뇌' + newLeftRight.printLeftRightInfo(0), 
                        value: newLeftRight.printLeftRightUI(0),
                        inline: false 
                    },
                    { name: '우뇌' + newLeftRight.printLeftRightInfo(1), 
                        value: newLeftRight.printLeftRightUI(1),
                        inline: false 
                    },
                    { name: '과부하' + newLeftRight.printLeftRightInfo(2), 
                        value: newLeftRight.printLeftRightUI(2),
                        inline: false 
                    }
                );

                // 강화 버튼
                const upgradeLeft = new ButtonBuilder().setCustomId('upgrade_left_' + userId).setLabel('좌뇌 활성화').setStyle(ButtonStyle.Success).setDisabled(newLeftRight.isLeftUpgradeFinished);
                const upgradeRight = new ButtonBuilder().setCustomId('upgrade_right_' + userId).setLabel('우뇌 활성화').setStyle(ButtonStyle.Success).setDisabled(newLeftRight.isRightUpgradeFinished);
                const upgradeOverload = new ButtonBuilder().setCustomId('upgrade_overload_' + userId).setLabel('과부하 활성화').setStyle(ButtonStyle.Success).setDisabled(newLeftRight.isOverloadUpgradeFinished);
                // 교체 버튼
                const btnEquipLeftRight = new ButtonBuilder().setCustomId('equip_left_right_' + userId).setLabel('교체').setStyle(ButtonStyle.Primary).setDisabled(!newLeftRight.isEquipable);
                // 초기화 버튼
                const resetLeftRight = new ButtonBuilder().setCustomId('reset_left_right_' + userId).setLabel('초기화').setStyle(ButtonStyle.Danger).setDisabled(!newLeftRight.isResetable);
                const rowButtonUpgrade = new ActionRowBuilder<ButtonBuilder>().addComponents([upgradeLeft, upgradeRight, upgradeOverload]);
                const rowButtonEquipReset = new ActionRowBuilder<ButtonBuilder>().addComponents([btnEquipLeftRight, resetLeftRight]);
        
                await interaction.update({ 
                    embeds: [embed], 
                    components: [rowButtonUpgrade, rowButtonEquipReset],
                });
            }
            // 좌우뇌 교체
            if (interaction.customId.includes('equip_left_right')) {
                let brain = await getBrain(userId);
                if (!brain)  {
                    console.warn("좌우뇌 정보 오류 발생");
                    return;
                }

                const synapse = brain.brSynapse;
                const potential = brain.brPotential;
                const leftRightUpgrade = brain.brLeftRightUpgrade;

                // 시냅스 모두 사용
                if (synapse <= 0) {
                    const embed = new EmbedBuilder()
                    .setColor(getColorByPotential(potential))
                    .setTitle('🧠 좌우뇌 정보')
                    .setDescription('오늘 모든 시냅스를 사용했습니다.\n내일 다시 두뇌-레벨 메뉴의 [진화]를 통해 시냅스를 충전하세요!\n')
                    .setThumbnail(interaction.user?.displayAvatarURL() || '')
                    .setFooter({
                        text: `요청자: ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL()
                    });

                    embed.addFields(
                        { name: '좌뇌' + leftRightUpgrade.printLeftRightInfo(0), 
                            value: leftRightUpgrade.printLeftRightUI(0),
                            inline: false 
                        },
                        { name: '우뇌' + leftRightUpgrade.printLeftRightInfo(1), 
                            value: leftRightUpgrade.printLeftRightUI(1),
                            inline: false 
                        },
                        { name: '과부하' + leftRightUpgrade.printLeftRightInfo(2), 
                            value: leftRightUpgrade.printLeftRightUI(2),
                            inline: false 
                        }
                    );

                    // 강화 버튼
                    const upgradeLeft = new ButtonBuilder().setCustomId('upgrade_left_' + userId).setLabel('좌뇌 활성화').setStyle(ButtonStyle.Success).setDisabled(true);
                    const upgradeRight = new ButtonBuilder().setCustomId('upgrade_right_' + userId).setLabel('우뇌 활성화').setStyle(ButtonStyle.Success).setDisabled(true);
                    const upgradeOverload = new ButtonBuilder().setCustomId('upgrade_overload_' + userId).setLabel('과부하 활성화').setStyle(ButtonStyle.Success).setDisabled(true);
                    // 교체 버튼
                    const btnEquipLeftRight = new ButtonBuilder().setCustomId('equip_left_right_' + userId).setLabel('교체').setStyle(ButtonStyle.Primary).setDisabled(!leftRightUpgrade.isEquipable);
                    // 초기화 버튼
                    const resetLeftRight = new ButtonBuilder().setCustomId('reset_left_right_' + userId).setLabel('초기화').setStyle(ButtonStyle.Danger).setDisabled(true);
                    const rowButtonUpgrade = new ActionRowBuilder<ButtonBuilder>().addComponents([upgradeLeft, upgradeRight, upgradeOverload]);
                    const rowButtonEquipReset = new ActionRowBuilder<ButtonBuilder>().addComponents([btnEquipLeftRight, resetLeftRight]);
            
                    await interaction.update({ 
                        embeds: [embed], 
                        components: [rowButtonUpgrade, rowButtonEquipReset],
                    });
                    return;
                }

                let result = false;
                result = await equipLeftRight(userId);
                // IQ 계산 DB 저장
                const newBrain = await getBrain(userId);
                if (newBrain) {
                    brain = newBrain;
                }
                await changeIq(brain);
                // DB 작업 실패 시
                if (!result) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🧠 좌우뇌 정보')
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
                .setTitle('🧠 좌우뇌 정보')
                .setDescription('잔여 시냅스: ' + brain.brSynapse + ' / 1000\n' 
                    + '활성화 확률: 75%\n교체 완료! 적용 스탯: ' + leftRightUpgrade.getLeftRightStat(0) + ' / '+ leftRightUpgrade.getLeftRightStat(1))
                .setThumbnail(interaction.user?.displayAvatarURL() || '')
                .setFooter({
                    text: `요청자: ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });
        
                embed.addFields(
                    { name: '좌뇌' + leftRightUpgrade.printLeftRightInfo(0), 
                        value: leftRightUpgrade.printLeftRightUI(0),
                        inline: false 
                    },
                    { name: '우뇌' + leftRightUpgrade.printLeftRightInfo(1), 
                        value: leftRightUpgrade.printLeftRightUI(1),
                        inline: false 
                    },
                    { name: '과부하' + leftRightUpgrade.printLeftRightInfo(2), 
                        value: leftRightUpgrade.printLeftRightUI(2),
                        inline: false 
                    }
                );

                // 강화 버튼
                const upgradeLeft = new ButtonBuilder().setCustomId('upgrade_left_' + userId).setLabel('좌뇌 활성화').setStyle(ButtonStyle.Success).setDisabled(leftRightUpgrade.isLeftUpgradeFinished);
                const upgradeRight = new ButtonBuilder().setCustomId('upgrade_right_' + userId).setLabel('우뇌 활성화').setStyle(ButtonStyle.Success).setDisabled(leftRightUpgrade.isRightUpgradeFinished);
                const upgradeOverload = new ButtonBuilder().setCustomId('upgrade_overload_' + userId).setLabel('과부하 활성화').setStyle(ButtonStyle.Success).setDisabled(leftRightUpgrade.isOverloadUpgradeFinished);
                // 교체 버튼
                const btnEquipLeftRight = new ButtonBuilder().setCustomId('equip_left_right_' + userId).setLabel('교체').setStyle(ButtonStyle.Primary).setDisabled(!leftRightUpgrade.isEquipable);
                // 초기화 버튼
                const resetLeftRight = new ButtonBuilder().setCustomId('reset_left_right_' + userId).setLabel('초기화').setStyle(ButtonStyle.Danger).setDisabled(!leftRightUpgrade.isResetable);
                const rowButtonUpgrade = new ActionRowBuilder<ButtonBuilder>().addComponents([upgradeLeft, upgradeRight, upgradeOverload]);
                const rowButtonEquipReset = new ActionRowBuilder<ButtonBuilder>().addComponents([btnEquipLeftRight, resetLeftRight]);
        
                await interaction.update({ 
                    embeds: [embed], 
                    components: [rowButtonUpgrade, rowButtonEquipReset],
                });
            }
            // 좌우뇌 초기화
            if (interaction.customId.includes('reset_left_right')) {
                let brain = await getBrain(userId);
                if (!brain)  {
                    console.warn("좌우뇌 정보 오류 발생");
                    return;
                }

                const synapse = brain.brSynapse;
                const potential = brain.brPotential;
                const leftRightUpgrade = brain.brLeftRightUpgrade;

                // 시냅스 모두 사용
                if (synapse <= 0) {
                    const embed = new EmbedBuilder()
                    .setColor(getColorByPotential(potential))
                    .setTitle('🧠 좌우뇌 정보')
                    .setDescription('오늘 모든 시냅스를 사용했습니다.\n내일 다시 두뇌-레벨 메뉴의 [진화]를 통해 시냅스를 충전하세요!\n')
                    .setThumbnail(interaction.user?.displayAvatarURL() || '')
                    .setFooter({
                        text: `요청자: ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL()
                    });

                    embed.addFields(
                        { name: '좌뇌' + leftRightUpgrade.printLeftRightInfo(0), 
                            value: leftRightUpgrade.printLeftRightUI(0),
                            inline: false 
                        },
                        { name: '우뇌' + leftRightUpgrade.printLeftRightInfo(1), 
                            value: leftRightUpgrade.printLeftRightUI(1),
                            inline: false 
                        },
                        { name: '과부하' + leftRightUpgrade.printLeftRightInfo(2), 
                            value: leftRightUpgrade.printLeftRightUI(2),
                            inline: false 
                        }
                    );
                    // 강화 버튼
                    const upgradeLeft = new ButtonBuilder().setCustomId('upgrade_left_' + userId).setLabel('좌뇌 활성화').setStyle(ButtonStyle.Success).setDisabled(true);
                    const upgradeRight = new ButtonBuilder().setCustomId('upgrade_right_' + userId).setLabel('우뇌 활성화').setStyle(ButtonStyle.Success).setDisabled(true);
                    const upgradeOverload = new ButtonBuilder().setCustomId('upgrade_overload_' + userId).setLabel('과부하 활성화').setStyle(ButtonStyle.Success).setDisabled(true);
                    // 교체 버튼
                    const btnEquipLeftRight = new ButtonBuilder().setCustomId('equip_left_right_' + userId).setLabel('교체').setStyle(ButtonStyle.Primary).setDisabled(!leftRightUpgrade.isEquipable);
                    // 초기화 버튼
                    const resetLeftRight = new ButtonBuilder().setCustomId('reset_left_right_' + userId).setLabel('초기화').setStyle(ButtonStyle.Danger).setDisabled(true);
                    const rowButtonUpgrade = new ActionRowBuilder<ButtonBuilder>().addComponents([upgradeLeft, upgradeRight, upgradeOverload]);
                    const rowButtonEquipReset = new ActionRowBuilder<ButtonBuilder>().addComponents([btnEquipLeftRight, resetLeftRight]);
            
                    await interaction.update({ 
                        embeds: [embed], 
                        components: [rowButtonUpgrade, rowButtonEquipReset],
                    });
                    return;
                }

                let result = false;
                result = await resetLeftRightUpgrade(userId);
                const leftRightAfterReset = new LeftRight('00000000000000000000000000000075');
                // IQ 계산 DB 저장
                const newBrain = await getBrain(userId);
                if (newBrain) {
                    brain = newBrain;
                }
                await changeIq(brain);
                // DB 작업 실패 시
                if (!result) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🧠 좌우뇌 정보')
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
                .setTitle('🧠 좌우뇌 정보')
                .setDescription('잔여 시냅스: ' + brain.brSynapse + ' / 1000\n' + '활성화 확률: 75%\n초기화 완료\n')
                .setThumbnail(interaction.user?.displayAvatarURL() || '')
                .setFooter({
                    text: `요청자: ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });
        
                embed.addFields(
                    { name: '좌뇌 (+0)[0등급]', 
                        value: leftRightAfterReset.printLeftRightUI(0),
                        inline: false 
                    },
                    { name: '우뇌 (+0)[0등급]', 
                        value: leftRightAfterReset.printLeftRightUI(1),
                        inline: false 
                    },
                    { name: '과부하 (+0)[0등급]', 
                        value: leftRightAfterReset.printLeftRightUI(2),
                        inline: false 
                    }
                );

                // 강화 버튼
                const upgradeLeft = new ButtonBuilder().setCustomId('upgrade_left_' + userId).setLabel('좌뇌 활성화').setStyle(ButtonStyle.Success);
                const upgradeRight = new ButtonBuilder().setCustomId('upgrade_right_' + userId).setLabel('우뇌 활성화').setStyle(ButtonStyle.Success);
                const upgradeOverload = new ButtonBuilder().setCustomId('upgrade_overload_' + userId).setLabel('과부하 활성화').setStyle(ButtonStyle.Success);
                // 교체 버튼
                const btnEquipLeftRight = new ButtonBuilder().setCustomId('equip_left_right_' + userId).setLabel('교체').setStyle(ButtonStyle.Primary).setDisabled(true);;
                // 초기화 버튼
                const resetLeftRight = new ButtonBuilder().setCustomId('reset_left_right_' + userId).setLabel('초기화').setStyle(ButtonStyle.Danger).setDisabled(true);
                const rowButtonUpgrade = new ActionRowBuilder<ButtonBuilder>().addComponents([upgradeLeft, upgradeRight, upgradeOverload]);
                const rowButtonEquipReset = new ActionRowBuilder<ButtonBuilder>().addComponents([btnEquipLeftRight, resetLeftRight]);
        
                await interaction.update({ 
                    embeds: [embed], 
                    components: [rowButtonUpgrade, rowButtonEquipReset],
                });
            }
        } catch (error) {
            console.error(error);
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

export function sendMessageOnChannel(channelId: string, message: string) {
    const channel = client.channels.cache.get(channelId) as TextChannel;

    channel.send(message);
}

// commands 컬렉션 내보내기 (다른 파일에서 명령어 목록에 접근할 수 있도록)
export { commands };
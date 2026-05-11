import { getNeuronDataByLv } from '../../brain_upgrade/upgrade.neuron';
import { getPotentialData, initBrainPotential } from '../../brain_upgrade/upgrade.potential';
import { insertNewLog } from '../log/log.service';
import { findBrainById, findBrainIqTop10ByServer, findBrainLevelTop10ByServer, findBrainNeuronTop10ByServer, insertBrainIfNotExists, updateIq, updateNeuron, updatePotential } from './brain.repository';
import { Brain, BrainRow } from './brain.types';

function toBrain(row: BrainRow) : Brain {
    return {
        discordUserId: row.discord_user_id,
        dtCreated: row.dt_created,
        dtModified: row.dt_modified,
        brLv: row.br_lv,
        brNeuronLv: row.br_neuron_lv,
        brPotential: row.br_potential,
        brIq: row.br_iq,
    };
}

export async function getBrain(userId: string): Promise<Brain | null> {
    const row = await findBrainById(userId);
    if (!row) return null;

    return {
        discordUserId: row.discord_user_id,
        dtCreated: row.dt_created,
        dtModified: row.dt_modified,
        brLv: row.br_lv,
        brNeuronLv: row.br_neuron_lv,
        brPotential: row.br_potential,
        brIq: row.br_iq,
    };
};

export async function getBrainTop10ByIq(serverId: string): Promise<Brain[]> {
    const rows = await findBrainIqTop10ByServer(serverId);

    return rows.map(toBrain);
};

export async function getBrainTop10ByNeuron(serverId: string): Promise<Brain[]> {
    const rows = await findBrainNeuronTop10ByServer(serverId);

    return rows.map(toBrain);
};

export async function getBrainTop10ByLevel(serverId: string): Promise<Brain[]> {
    const rows = await findBrainLevelTop10ByServer(serverId);

    return rows.map(toBrain);
};

export async function insertNewBrain(userId: string): Promise<boolean> {
    // 신규 생성 두뇌 잠재능력 초기화 로직
    const potential = initBrainPotential();
    const iq = getIq({
        brNeuronLv: 1,
        brPotential: potential,
        discordUserId: '',
        dtCreated: new Date(),
        dtModified: new Date(),
        brLv: 0,
        brIq: ''
    })

    return await insertBrainIfNotExists(userId, potential, iq);
};

export async function changeNeuron(userId: string, oldNeuron: number, newNeuron: number): Promise<boolean> {
    const result = await updateNeuron(userId, newNeuron);
    
    // DB 로그 저장
    // TODO: 잠재능력 메모리얼 기능 구현에 따른 로그 수정
    insertNewLog(userId, '2', oldNeuron + '', newNeuron + '');

    return result
};

export async function changePotential(userId: string, oldPotential: string, newPotential: string): Promise<boolean> {
    const result = await updatePotential(userId, newPotential);
    
    // DB 로그 저장
    // TODO: 잠재능력 메모리얼 기능 구현에 따른 로그 수정
    insertNewLog(userId, '4', oldPotential, newPotential);

    return result
};

export async function changeIq(brain: Brain): Promise<boolean> {
    const iq = getIq(brain)

    const result = await updateIq(brain.discordUserId, iq);

    return result
};

export function getIq(brain: Brain): string {
    const neuronLv = brain.brNeuronLv;
    const potential = brain.brPotential;

    const neuronData = getNeuronDataByLv(neuronLv);
    const potentialData = getPotentialData(potential);

    const baseInt = brain.brLv;
    const totalAddedInt = baseInt + neuronData.addStat + potentialData.addStat;
    const totalMultStat = neuronData.multStat + potentialData.multStat;

    console.log('totalAddedInt: ' + totalAddedInt);
    console.log('totalMultStat: ' + totalMultStat + '%');

    return (totalAddedInt + totalAddedInt * (totalMultStat * 0.01)) + '';
}
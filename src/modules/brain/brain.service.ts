import { initBrainPotential } from '../../brain_upgrade/upgrade.potential';
import { insertNewLog } from '../log/log.service';
import { findBrainById, insertBrainIfNotExists, updateNeuron, updatePotential } from './brain.repository';
import { Brain } from './brain.types';


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
    };
};

export async function insertNewBrain(userId: string): Promise<boolean> {
    // 신규 생성 두뇌 잠재능력 초기화 로직
    const potential = initBrainPotential();

    return await insertBrainIfNotExists(userId, potential);
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

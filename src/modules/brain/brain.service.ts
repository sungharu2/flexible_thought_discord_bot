import { initBrainPotential } from '../../brain_upgrade/upgrade.potential';
import { findBrainById, insertBrainIfNotExists, updatePotential } from './brain.repository';
import { Brain } from './brain.types';


export async function getBrain(userId: string): Promise<Brain | null> {
    const row = await findBrainById(userId);
    if (!row) return null;

    return {
        discordUserId: row.discord_user_id,
        dtCreated: row.dt_created,
        dtModified: row.dt_modified,
        brLv: row.br_lv,
        brInt: row.br_int,
        brPotential: row.br_potential,
    };
};

export async function insertNewBrain(userId: string): Promise<boolean> {
    // 신규 생성 두뇌 잠재능력 초기화 로직
    const potential = initBrainPotential();

    return await insertBrainIfNotExists(userId, potential);
};

export async function changePotential(userId: string, newPotential: string): Promise<boolean> {

    return await updatePotential(userId, newPotential);
};

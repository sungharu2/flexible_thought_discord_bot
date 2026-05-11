import mysql, { ResultSetHeader } from 'mysql2';
import { Brain, BrainRow } from './brain.types';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'ft',
    database: 'flexible_thoughts',
    password: 'ft20260506',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();
// 공통 query 래퍼
async function query<T>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await promisePool.query(sql, params);
    return rows as T[];
}

export async function findBrainById(userId: string): Promise<BrainRow | null> {
    const rows = await query<BrainRow>(
        'SELECT * FROM tb_brain WHERE discord_user_id = ?;', 
        [userId]
    );
    return rows[0] ?? null;
};

export async function findBrainIqTop10ByServer(serverId: string): Promise<BrainRow[]> {
    const rows = await query<BrainRow>(
        `SELECT tb.* 
        FROM tb_brain tb, tb_user_server_map tm
        WHERE 
            tb.discord_user_id = tm.discord_user_id
            AND tm.discord_server_id = ?
        ORDER BY br_iq desc LIMIT 10;`,
        [serverId]
    );
    return rows;
};

export async function findBrainNeuronTop10ByServer(serverId: string): Promise<BrainRow[]> {
    const rows = await query<BrainRow>(
        `SELECT tb.* 
        FROM tb_brain tb, tb_user_server_map tm
        WHERE 
            tb.discord_user_id = tm.discord_user_id
            AND tm.discord_server_id = ?
        ORDER BY br_neuron_lv desc LIMIT 10;`,
        [serverId]
    );
    return rows;
};

export async function findBrainLevelTop10ByServer(serverId: string): Promise<BrainRow[]> {
    const rows = await query<BrainRow>(
        `SELECT tb.* 
        FROM tb_brain tb, tb_user_server_map tm
        WHERE 
            tb.discord_user_id = tm.discord_user_id
            AND tm.discord_server_id = ?
        ORDER BY br_lv desc LIMIT 10;`,
        [serverId]
    );
    return rows;
};


export async function insertBrainIfNotExists(userId: string, potential: string, iq: string): Promise<boolean> {
    const newBrain = {
        'discord_user_id': userId,
        'dt_created': new Date(),
        'dt_modified': new Date(),
        'br_lv': 1,
        'br_neuron_lv': 0,
        'br_potential': potential,
        'br_iq': iq,
    };

    const result = await query(
        'INSERT IGNORE INTO tb_brain set ?',
        [newBrain]
    ) as unknown as ResultSetHeader;

    //console.log(result);
    return result.affectedRows > 0;
}

export async function updateLevel(userId: string, level: number): Promise<boolean> {
    const result = await query(
        `
        UPDATE tb_brain
        SET 
            dt_modified = ?,
            br_lv = ?
        WHERE discord_user_id = ?
        `,
        [new Date(), level, userId]
    ) as unknown as ResultSetHeader;
    
    //console.log(result);
    return result.affectedRows > 0;
}

export async function updateNeuron(userId: string, neuronLv: number): Promise<boolean> {
    const result = await query(
        `
        UPDATE tb_brain
        SET 
            dt_modified = ?,
            br_neuron_lv = ?
        WHERE discord_user_id = ?
        `,
        [new Date(), neuronLv, userId]
    ) as unknown as ResultSetHeader;
    
    //console.log(result);
    return result.affectedRows > 0;
}

export async function updatePotential(userId: string, newPotential: string): Promise<boolean> {
    const result = await query(
        `
        UPDATE tb_brain
        SET 
            dt_modified = ?,
            br_potential = ?
        WHERE discord_user_id = ?
        `,
        [new Date(), newPotential, userId]
    ) as unknown as ResultSetHeader;
    
    //console.log(result);
    return result.affectedRows > 0;
}

export async function updateIq(userId: string, iq: string): Promise<boolean> {
    const result = await query(
        `
        UPDATE tb_brain
        SET 
            dt_modified = ?,
            br_iq = ?
        WHERE discord_user_id = ?
        `,
        [new Date(), iq, userId]
    ) as unknown as ResultSetHeader;
    
    //console.log(result);
    return result.affectedRows > 0;
}

export async function updateEvolveBrain(userId: string): Promise<boolean> {
    const result = await query(
        `
        UPDATE tb_brain
        SET 
            dt_modified = ?,
            br_synapse = ?,
            br_evolved = ?
        WHERE discord_user_id = ?
        `,
        [new Date(), 1000, true, userId]
    ) as unknown as ResultSetHeader;
    
    //console.log(result);
    return result.affectedRows > 0;
}

export async function updateAllIsEvolvedFalse(): Promise<boolean> {
    const result = await query(
        `
        UPDATE tb_brain
        SET 
            dt_modified = ?,
            br_evolved = ?
        WHERE 1 = 1
        `,
        [new Date(), false]
    ) as unknown as ResultSetHeader;
    
    //console.log(result);
    return result.affectedRows > 0;
}

export async function decreaseSynapse(userId: string): Promise<boolean> {
    const result = await query(
        `
        UPDATE tb_brain
        SET 
            dt_modified = ?,
            br_synapse = br_synapse - 1
        WHERE discord_user_id = ?
        `,
        [new Date(), userId]
    ) as unknown as ResultSetHeader;
    
    //console.log(result);
    return result.affectedRows > 0;
}
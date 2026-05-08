import { findLogById, insertLog } from './log.repository';
import { Log } from './log.types';


export async function getLog(userId: string): Promise<Log | null> {
    const row = await findLogById(userId);
    if (!row) return null;

    return {
        discordUserId: row.discord_user_id,
        dtCreated: row.dt_created,
        logType: row.log_type,
        valBefore: row.val_before,
        valAfter: row.val_after,
    };
};

export async function insertNewLog(userId: string, logType: string, valBefore: string, valAfter: string): Promise<boolean> {

    return await insertLog(userId, logType, valBefore, valAfter);
};

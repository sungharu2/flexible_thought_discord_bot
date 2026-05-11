import { findUserById, insertUserIfNotExists } from './user.repository.js';
import type { User } from './user.types.js';


export async function getUser(userId: string): Promise<User | null> {
    const row = await findUserById(userId);
    if (!row) return null;

    return {
        discordUserId: row.discord_user_id,
        dtCreated: row.dt_created,
    };
};

export async function insertNewUser(userId: string) {
    return await insertUserIfNotExists(userId);
};

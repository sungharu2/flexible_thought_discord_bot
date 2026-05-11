import { findUserMapsById, insertUserMapIfNotExist } from './usermap.repository.js';
import type { UserMap, UserMapRow } from './usermap.types.js';

function toUserMap(row: UserMapRow) : UserMap {
    return {
        discordUserId: row.discord_user_id,
        discordServerId: row.discord_server_id,
        dtCreated: row.dt_created,
    };
}

export async function getUserMapsById(userId: string): Promise<UserMap[]> {
    const row = await findUserMapsById(userId);

    return row.map(toUserMap);
};

export async function insertNewUserMap(userId: string, serverId: string) {
    return await insertUserMapIfNotExist(userId, serverId);
};

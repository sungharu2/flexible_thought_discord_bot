import mysql from 'mysql2';
import type { UserMapRow } from './usermap.types.js';

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

export async function findUserMapsById(userId: string): Promise<UserMapRow[]> {
    const rows = await query<UserMapRow>(
      'SELECT * FROM tb_user_server_map WHERE user_id = ?',
      [userId]
    );
  
    return rows;
}

export async function insertUserMapIfNotExist(userId: string, serverId: string) {
    const newUserMap = {
        'discord_user_id': userId,
        'discord_server_id': serverId,
        'dt_created': new Date()
    };

    try {
        const [rows] = await promisePool.query('INSERT IGNORE INTO tb_user_server_map SET ?', newUserMap);
        return rows;
    }
    catch (err) {
        console.log(err);
    }
}
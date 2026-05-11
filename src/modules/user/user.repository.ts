import mysql from 'mysql2';
import type { UserRow } from './user.types.js';

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

export async function findUserById(userId: string): Promise<UserRow | null> {
    const rows = await query<UserRow>(
      'SELECT user_id, dt_created FROM tb_user WHERE user_id = ?',
      [userId]
    );
  
    return rows[0] ?? null;
}

export async function insertUserIfNotExists(userId: string) {
    const newUser = {
        'discord_user_id': userId,
        'dt_created': new Date()
    };

    try {
        const [rows] = await promisePool.query('INSERT IGNORE INTO tb_user SET ?', newUser);
        return rows;
    }
    catch (err) {
        console.log(err);
    }
}
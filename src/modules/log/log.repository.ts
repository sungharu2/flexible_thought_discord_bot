import mysql from 'mysql2';
import type { ResultSetHeader } from 'mysql2';
import type { LogRow } from './log.types.js';

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

export async function findLogById(userId: string): Promise<LogRow | null> {
    const rows = await query<LogRow>(
        'SELECT * FROM tb_log_brain WHERE discord_user_id = ?;', 
        [userId]
    );
    return rows[0] ?? null;
};

export async function insertLog(userId: string, logType: string, valBefore: string, valAfter: string): Promise<boolean> {
    const newLog = {
        'discord_user_id': userId,
        'dt_created': new Date(),
        'log_type': logType,
        'val_before': valBefore,
        'val_after': valAfter,
    };

    const result = await query(
        'INSERT INTO tb_log_brain set ?',
        [newLog]
    ) as unknown as ResultSetHeader;

    //console.log(result);
    return result.affectedRows > 0;
}
export type LogRow = {
    discord_user_id: string;
    dt_created: Date;
    log_type: number;
    val_before: number;
    val_after: string;
 };
  
export type Log = {
    discordUserId: string;
    dtCreated: Date;
    logType: number;
    valBefore: number;
    valAfter: string;
}
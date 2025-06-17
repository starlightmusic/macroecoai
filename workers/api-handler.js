export async function getRecentIndicators(db, limit = 20) {
    const { results } = await db.prepare(
        `SELECT indicator_name, indicator_code, macro_angle, value, period_date, frequency
         FROM ethiopian_indicators ORDER BY period_date DESC LIMIT ?`
    ).bind(limit).all();
    return results;
}

export async function getCollectionLogs(db, limit = 20) {
    const { results } = await db.prepare(
        `SELECT * FROM collection_logs ORDER BY id DESC LIMIT ?`
    ).bind(limit).all();
    return results;
}

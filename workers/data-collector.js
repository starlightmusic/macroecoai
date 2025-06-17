import { getRecentIndicators, getCollectionLogs } from './api-handler.js';

const ETHIOPIAN_INDICATORS = [
    {
        macroAngle: "Inflation pressure",
        name: "Consumer-price index (all items)",
        code: "PCPI_IX",
        frequency: "Monthly",
        endpoint: "https://api.db.nomics.world/v22/series/IMF/IFS.M.ETH.PCPI_IX.json"
    },
    {
        macroAngle: "Growth pulse",
        name: "Real GDP, y/y % change",
        code: "NGDP_R_PCH",
        frequency: "Annual",
        endpoint: "https://api.db.nomics.world/v22/series/IMF/IFS.A.ETH.NGDP_R_PCH.json"
    },
    {
        macroAngle: "Policy stance",
        name: "National Bank of Ethiopia policy/standing-facility rate",
        code: "IR_NB_01_PA",
        frequency: "Monthly",
        endpoint: "https://api.db.nomics.world/v22/series/IMF/IFS.M.ETH.IR_NB_01_PA.json"
    },
    {
        macroAngle: "Currency health",
        name: "ETB per USD, period-average",
        code: "ENDA_XDC_USD_RATE",
        frequency: "Monthly",
        endpoint: "https://api.db.nomics.world/v22/series/IMF/IFS.M.ETH.ENDA_XDC_USD_RATE.json"
    },
    {
        macroAngle: "External sustainability",
        name: "Current-account balance (US $)",
        code: "BCA_USD",
        frequency: "Annual",
        endpoint: "https://api.db.nomics.world/v22/series/IMF/IFS.A.ETH.BCA_USD.json"
    }
];

function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function parsePeriod(period) {
    if (/^\d{4}$/.test(period)) return `${period}-01-01`;
    if (/^\d{4}-\d{2}$/.test(period)) return `${period}-01`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(period)) return period;
    return null;
}

async function insertIndicatorData(indicator, observation, env) {
    const stmt = env.DB.prepare(`
        INSERT INTO ethiopian_indicators (
            indicator_name, indicator_code, macro_angle, value, period_date, frequency
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(indicator_code, period_date) DO UPDATE SET
            value=excluded.value,
            updated_at=CURRENT_TIMESTAMP`);
    await stmt.bind(
        indicator.name,
        indicator.code,
        indicator.macroAngle,
        observation.value,
        observation.periodDate,
        indicator.frequency
    ).run();
}

async function collectIndicatorData(indicator, env) {
    let retries = 0;
    const start = Date.now();
    while (retries < 2) {
        try {
            const res = await fetch(indicator.endpoint, { cf: { timeout: 30 } });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const obsArr = data?.series?.[0]?.observations;
            if (!Array.isArray(obsArr) || obsArr.length === 0) {
                throw new Error('No observations');
            }
            const obs = obsArr[obsArr.length - 1];
            const periodDate = parsePeriod(obs.period);
            const value = parseFloat(obs.value);
            if (!periodDate || Number.isNaN(value)) {
                throw new Error('Invalid observation');
            }
            await insertIndicatorData(indicator, { value, periodDate }, env);
            return { success: true, duration: Date.now() - start };
        } catch (err) {
            if (retries === 0) {
                await sleep(5000);
                retries++;
            } else {
                return { success: false, error: err.message };
            }
        }
    }
}

async function collectAllIndicators(env) {
    const summary = {
        total: ETHIOPIAN_INDICATORS.length,
        success: 0,
        failed: 0,
        errors: []
    };
    for (const indicator of ETHIOPIAN_INDICATORS) {
        const result = await collectIndicatorData(indicator, env);
        if (result && result.success) {
            summary.success++;
        } else {
            summary.failed++;
            summary.errors.push(`${indicator.code}: ${result?.error}`);
        }
        await sleep(200);
    }
    return summary;
}

async function logCollectionResults(summary, env) {
    const stmt = env.DB.prepare(`
        INSERT INTO collection_logs (
            collection_date,
            total_indicators,
            successful_collections,
            failed_collections,
            error_details,
            execution_duration_ms
        ) VALUES (?, ?, ?, ?, ?, ?)`);
    await stmt.bind(
        new Date().toISOString().slice(0, 10),
        summary.total,
        summary.success,
        summary.failed,
        summary.errors.join('; '),
        summary.executionDurationMs
    ).run();
}

export default {
    async scheduled(controller, env, ctx) {
        const start = Date.now();
        const summary = await collectAllIndicators(env);
        summary.executionDurationMs = Date.now() - start;
        await logCollectionResults(summary, env);
    },
    async fetch(request, env) {
        const url = new URL(request.url);
        if (request.method === 'POST' && url.pathname === '/collect') {
            const start = Date.now();
            const summary = await collectAllIndicators(env);
            summary.executionDurationMs = Date.now() - start;
            await logCollectionResults(summary, env);
            return new Response(JSON.stringify(summary), { headers: { 'Content-Type': 'application/json' } });
        }
        if (request.method === 'GET' && url.pathname === '/data') {
            const data = await getRecentIndicators(env.DB);
            return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
        }
        if (request.method === 'GET' && url.pathname === '/logs') {
            const logs = await getCollectionLogs(env.DB);
            return new Response(JSON.stringify(logs), { headers: { 'Content-Type': 'application/json' } });
        }
        if (request.method === 'GET' && url.pathname === '/health') {
            return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response('Not found', { status: 404 });
    }
};

export { collectAllIndicators };

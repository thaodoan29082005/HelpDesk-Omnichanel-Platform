import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
    constructor(private readonly dataSource: DataSource) { }

    async check() {
        let dbStatus = 'disconnected';
        let dbLatencyMs = -1;

        try {
            const startTime = Date.now();
            await this.dataSource.query('SELECT 1');
            dbLatencyMs = Date.now() - startTime;
            dbStatus = 'connected';
        } catch (error) {
            dbStatus = `error: ${(error as Error).message}`;
        }

        return {
            status: 'ok',
            service: 'HelpDesk+ Omnichannel AI API',
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime()),
            database: {
                status: dbStatus,
                latencyMs: dbLatencyMs,
            },
        };
    }
}

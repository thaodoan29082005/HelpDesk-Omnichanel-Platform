import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service.js';

@ApiTags('System & Health')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Get()
    @ApiOperation({ summary: 'Kiểm tra trạng thái server Backend và kết nối PostgreSQL' })
    @ApiResponse({ status: 200, description: 'Hệ thống hoạt động bình thường' })
    async getHealth() {
        return this.healthService.check();
    }
}

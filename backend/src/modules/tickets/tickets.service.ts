import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    Ticket,
    User,
    Role,
    Channel,
    TicketMessage,
    TicketStatusHistory,
} from '../../database/entities/index.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { QueryTicketDto } from './dto/query-ticket.dto.js';

@Injectable()
export class TicketsService {
    private readonly logger = new Logger(TicketsService.name);

    constructor(
        @InjectRepository(Ticket)
        private readonly ticketRepo: Repository<Ticket>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,

        @InjectRepository(Channel)
        private readonly channelRepo: Repository<Channel>,

        @InjectRepository(TicketMessage)
        private readonly messageRepo: Repository<TicketMessage>,

        @InjectRepository(TicketStatusHistory)
        private readonly statusHistoryRepo: Repository<TicketStatusHistory>,
    ) { }

    /**
     * Sinh mã vé ngẫu nhiên duy nhất định dạng TK-xxxx (ví dụ: TK-1082)
     */
    private async generateUniqueTicketCode(): Promise<string> {
        let code = '';
        let exists = true;
        let attempts = 0;

        while (exists && attempts < 10) {
            attempts++;
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            code = `TK-${randomNum}`;
            const found = await this.ticketRepo.findOne({ where: { ticket_code: code } });
            if (!found) {
                exists = false;
            }
        }
        return code;
    }

    /**
     * Tìm hoặc tự động tạo vai trò (Role)
     */
    private async getOrCreateRole(roleName: string): Promise<Role> {
        let role = await this.roleRepo.findOne({ where: { role_name: roleName } });
        if (!role) {
            role = this.roleRepo.create({ role_name: roleName });
            role = await this.roleRepo.save(role);
        }
        return role;
    }

    /**
     * Tìm hoặc tự động tạo kênh tiếp nhận (Channel)
     */
    private async getOrCreateChannel(channelType: string): Promise<Channel> {
        let channel = await this.channelRepo.findOne({ where: { channel_type: channelType } });
        if (!channel) {
            const channelNameMap: Record<string, string> = {
                web: 'Web Form',
                email: 'Email Support',
                telegram: 'Telegram Bot',
            };
            channel = this.channelRepo.create({
                channel_name: channelNameMap[channelType] || channelType.toUpperCase(),
                channel_type: channelType,
            });
            channel = await this.channelRepo.save(channel);
        }
        return channel;
    }

    /**
     * TASK 2.1 — API tạo ticket từ Web Form (Core API)
     * Tự động tạo khách hàng, kênh, mã vé TK-xxxx, tin nhắn đầu tiên và lịch sử trạng thái
     */
    async createFromWebForm(dto: CreateTicketDto): Promise<Ticket> {
        this.logger.log(`Tiếp nhận yêu cầu Web Form từ: ${dto.customer_email} - Tiêu đề: ${dto.subject}`);

        // 1. Tìm hoặc tạo tài khoản khách hàng
        let customer = await this.userRepo.findOne({ where: { email: dto.customer_email } });
        if (!customer) {
            const customerRole = await this.getOrCreateRole('customer');
            customer = this.userRepo.create({
                full_name: dto.customer_name,
                email: dto.customer_email,
                phone: dto.customer_phone || null,
                role_id: customerRole.role_id,
                status: 'active',
            });
            customer = await this.userRepo.save(customer);
        } else if (dto.customer_name && customer.full_name !== dto.customer_name) {
            customer.full_name = dto.customer_name;
            if (dto.customer_phone) customer.phone = dto.customer_phone;
            await this.userRepo.save(customer);
        }

        // 2. Tìm hoặc tạo Kênh tiếp nhận Web Form
        const channelType = dto.channel_type || 'web';
        const channel = await this.getOrCreateChannel(channelType);

        // 3. Sinh mã ticket duy nhất (TK-xxxx)
        const ticketCode = await this.generateUniqueTicketCode();

        // 4. Khởi tạo và lưu Ticket
        const ticket = this.ticketRepo.create({
            ticket_code: ticketCode,
            customer_id: customer.user_id,
            channel_id: channel.channel_id,
            subject: dto.subject,
            status: 'new',
            priority: dto.priority || 'medium',
            is_urgent_bumped: false,
        });
        const savedTicket = await this.ticketRepo.save(ticket);

        // 5. Lưu tin nhắn đầu tiên của khách hàng vào TicketMessage
        const initialMessage = this.messageRepo.create({
            ticket_id: savedTicket.ticket_id,
            sender_id: customer.user_id,
            sender_type: 'customer',
            content: dto.description,
            attachments: dto.attachment_url || null,
            is_ai_draft: false,
        });
        await this.messageRepo.save(initialMessage);

        // 6. Ghi nhận lịch sử trạng thái ban đầu
        const statusHistory = this.statusHistoryRepo.create({
            ticket_id: savedTicket.ticket_id,
            old_status: null,
            new_status: 'new',
            changed_by: customer.user_id,
        });
        await this.statusHistoryRepo.save(statusHistory);

        this.logger.log(`Tạo vé thành công: Mã [${savedTicket.ticket_code}] - ID: ${savedTicket.ticket_id}`);

        // 7. Trả về thông tin đầy đủ kèm quan hệ
        return this.findById(savedTicket.ticket_id);
    }

    /**
     * TASK 2.2 — API xem danh sách ticket có bộ lọc và phân trang
     * Ưu tiên các vé được AI đẩy khẩn cấp (is_urgent_bumped: true) lên đầu hàng đợi
     */
    async findAll(query: QueryTicketDto): Promise<{
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        data: Ticket[];
    }> {
        const page = query.page && query.page > 0 ? Number(query.page) : 1;
        const limit = query.limit && query.limit > 0 ? Number(query.limit) : 10;
        const skip = (page - 1) * limit;

        const qb = this.ticketRepo
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.customer', 'customer')
            .leftJoinAndSelect('ticket.assigned_agent', 'assigned_agent')
            .leftJoinAndSelect('ticket.channel', 'channel');

        // Lọc theo trạng thái
        if (query.status) {
            qb.andWhere('ticket.status = :status', { status: query.status });
        }

        // Lọc theo mức độ ưu tiên
        if (query.priority) {
            qb.andWhere('ticket.priority = :priority', { priority: query.priority });
        }

        // Lọc theo loại kênh
        if (query.channel_type) {
            qb.andWhere('channel.channel_type = :channel_type', { channel_type: query.channel_type });
        }

        // Lọc theo nhãn cảm xúc AI
        if (query.sentiment_label) {
            qb.andWhere('ticket.sentiment_label = :sentiment_label', { sentiment_label: query.sentiment_label });
        }

        // Lọc vé khẩn cấp do AI đẩy
        if (query.is_urgent_bumped !== undefined) {
            const isBumped = query.is_urgent_bumped === 'true' || query.is_urgent_bumped === '1';
            qb.andWhere('ticket.is_urgent_bumped = :isBumped', { isBumped });
        }

        // Tìm kiếm đa trường (Mã vé, Tiêu đề, Tên khách hàng)
        if (query.search) {
            qb.andWhere(
                '(ticket.ticket_code ILIKE :search OR ticket.subject ILIKE :search OR customer.full_name ILIKE :search)',
                { search: `%${query.search}%` },
            );
        }

        // Sắp xếp: Vé khẩn cấp do AI đẩy (is_urgent_bumped) lên đầu tiên, sau đó theo thời gian tạo mới nhất
        qb.orderBy('ticket.is_urgent_bumped', 'DESC')
            .addOrderBy('ticket.created_at', 'DESC')
            .skip(skip)
            .take(limit);

        const [data, total] = await qb.getManyAndCount();

        return {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            data,
        };
    }

    /**
     * TASK 2.2 — API xem chi tiết 1 ticket bằng ID hoặc ticket_code
     * Kèm toàn bộ tin nhắn trao đổi (TicketMessage) và lịch sử trạng thái
     */
    async findById(identifier: string): Promise<Ticket> {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);

        const qb = this.ticketRepo
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.customer', 'customer')
            .leftJoinAndSelect('ticket.assigned_agent', 'assigned_agent')
            .leftJoinAndSelect('ticket.team', 'team')
            .leftJoinAndSelect('ticket.channel', 'channel')
            .leftJoinAndSelect('ticket.sla', 'sla')
            .leftJoinAndSelect('ticket.messages', 'messages')
            .leftJoinAndSelect('messages.sender', 'sender')
            .leftJoinAndSelect('ticket.status_history', 'status_history')
            .leftJoinAndSelect('status_history.changer', 'changer');

        if (isUuid) {
            qb.where('ticket.ticket_id = :identifier', { identifier });
        } else {
            qb.where('ticket.ticket_code = :identifier', { identifier });
        }

        // Sắp xếp tin nhắn theo thời gian tăng dần
        qb.orderBy('messages.created_at', 'ASC');

        const ticket = await qb.getOne();

        if (!ticket) {
            throw new NotFoundException(`Không tìm thấy yêu cầu hỗ trợ với mã/ID: ${identifier}`);
        }

        return ticket;
    }
}

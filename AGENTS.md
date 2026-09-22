# AGENTS.md

## Custom Slash Commands

### `/archify`
When the user runs `/archify` or asks for architecture diagrams, workflows, sequence diagrams, dataflow, or state lifecycle diagrams:
- Use the `archify` CLI tool or skill.
- The command supports generating interactive HTML diagrams with dark/light themes, inline SVG, animations, and export features.
- Types: `architecture`, `workflow`, `sequence`, `dataflow`, `lifecycle`.
- Compile & deliver with `archify deliver <type> <candidate.json> <output.html> --quality showcase --json`.

---

## Phân công vai trò & Kế hoạch Sprint dự án HelpDesk+ (C1SE.92) — Đã Tối Ưu

### 1. Phân định vai trò (ĐÃ BỎ DEVOPS, GIẢM TẢI CHO PHÚ):
- **Võ Ngọc Phú** (~75h): **Scrum Master, Lead Developer (Backend & AI)**
  - Quản lý quy trình, theo dõi tiến độ Sprint và điều phối chung.
  - Thiết kế kiến trúc 4 tầng, phát triển các API cốt lõi Backend (NestJS).
  - Dẫn dắt nghiên cứu & triển khai 2 tính năng AI: (1) Sentiment & Urgency detection (tự động đẩy Priority lên đầu); (2) AI Auto-Draft Reply (gợi ý câu trả lời chuẩn mực).
  - *Đã giải phóng*: KHÔNG làm Frontend Unified Inbox, KHÔNG làm Tester.
- **Võ Thị Thu Lộc** (~76h): **Developer (Backend)**
  - Phối hợp xây dựng Backend, tập trung xử lý các Channel Adapters (Web Form, Email IMAP/SMTP, Telegram Webhook).
  - Xây dựng hệ thống Message Queue (BullMQ/Redis) xử lý bất đồng bộ & pipeline tiền xử lý dữ liệu cho AI.
  - Xây dựng WebSocket Server (Socket.IO) và API Outbound Dispatcher.
  - *Đã bỏ DevOps*: Chỉ cấu hình Docker Compose local (Postgres + Redis).
- **Võ Hồng Phúc** (~60h): **Developer (Frontend)**
  - Chuyên sâu Frontend React.js + Vite + Tailwind CSS.
  - Phụ trách chính: Thiết kế Wireframes & UI Mockup trên Figma (Component System), Giao diện **Unified Inbox** (chat đa kênh tập trung), Màn hình chi tiết Ticket Timeline, Hàng đợi Ticket, Badge hiển thị nguồn kênh & Nhãn cảm xúc/khẩn cấp AI, Tích hợp WebSocket client realtime.
- **Võ Lý Hùng** (~61h): **Developer (Frontend)**
  - Cùng chịu trách nhiệm mảng Frontend với Phúc.
  - Xử lý UI/UX tổng thể, xây dựng Dashboard báo cáo thống kê, các form đăng nhập/đăng xuất (Auth), Form khách hàng (Customer Portal), thiết kế giao diện tương tác nhanh với AI (Khung AI Draft Reply, nút 1-click chèn câu trả lời & gửi), quay Video Demo.
- **Trương Đình Thảo Đoan** (~59h): **QA/Tester Chuyên trách**
  - Kiểm thử toàn bộ chất lượng hệ thống từ Frontend đến Backend.
  - Xây dựng kịch bản kiểm thử đa kênh (Web, Email, Telegram), test hiệu năng API (< 500ms, 50 req/s).
  - Kiểm định độ chính xác và hợp lý của 2 tính năng AI (Phân loại cảm xúc/khẩn cấp & Độ chuẩn mực câu trả lời gợi ý).
  - Lập Test Report tổng kết đồ án & Chuẩn bị Slide báo cáo bảo vệ.

### 2. Hai tính năng AI cốt lõi:
1. **Đọc thái độ cảm xúc & Phát hiện từ ngữ gấp rút (Sentiment & Urgency Analysis)**: Quét tin nhắn đến, nhận diện từ ngữ cấp bách để tự động nâng Priority lên mức cao nhất (`Urgent`), gắn nhãn cảnh báo đỏ và đẩy ticket lên đầu hàng đợi.
2. **Gợi ý câu trả lời chuẩn mực (AI Auto-Draft Smart Reply)**: Quét yêu cầu của khách và ngữ cảnh hội thoại để sinh câu trả lời mẫu chuẩn mực, nhân viên CSKH chỉ cần xem qua, điều chỉnh nhẹ và bấm gửi nhanh chóng trên Unified Inbox.

Mọi đề xuất code, triển khai hay hướng dẫn đều bám sát theo đúng vai trò và thành viên phụ trách tương ứng.

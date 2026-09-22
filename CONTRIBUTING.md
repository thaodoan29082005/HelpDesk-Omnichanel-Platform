# Hướng Dẫn Quy Ước Làm Việc & Git Workflow — HelpDesk+ (C1SE.92)

Tài liệu này quy định quy trình phối hợp phát triển phần mềm, chuẩn commit và quản lý nhánh trên GitHub cho toàn bộ 5 thành viên nhóm đồ án **HelpDesk+**.

---

## 1. Cấu Trúc Nhánh Làm Việc (Git Branching Strategy)

Nhóm áp dụng mô hình **Git Flow rút gọn** phù hợp với tốc độ Sprint của đồ án:

* `main`: Nhánh ổn định cao nhất (Production-ready). Chỉ merge từ `develop` khi kết thúc Sprint hoặc có bản phát hành nghiệm thu. Được bảo vệ (Branch Protection), không commit trực tiếp.
* `develop`: Nhánh tích hợp chính của nhóm. Tất cả các tính năng mới sau khi test đạt chuẩn sẽ được merge vào đây.
* `feature/<task-id>-<short-description>`: Nhánh làm việc cho từng tính năng / task cụ thể.
  * *Ví dụ*: `feature/1.6-backend-nestjs-init`, `feature/1.8-figma-mockup`, `feature/3.3-ai-sentiment-backend`
* `bugfix/<issue-id>-<short-description>`: Nhánh sửa lỗi phát sinh.
  * *Ví dụ*: `bugfix/fix-email-imap-auth`, `bugfix/fix-ws-disconnect`

---

## 2. Quy Chuẩn Commit Message (Conventional Commits + Jira Task ID)

Mỗi commit message phải tuân thủ định dạng chuẩn sau:

```text
<type>(<scope>): [<task-id>] <Mô tả ngắn gọn bằng Tiếng Việt hoặc Tiếng Anh>
```

### Các tiền tố `<type>` được phép sử dụng:
* `feat`: Thêm tính năng mới (ví dụ API mới, giao diện mới).
* `fix`: Sửa lỗi (bug fix).
* `docs`: Cập nhật tài liệu (SRS, README, Architecture).
* `style`: Chỉnh sửa UI/UX, formatting code, Tailwind CSS không đổi logic.
* `refactor`: Tái cấu trúc code (tối ưu hiệu năng, clean code) không thay đổi tính năng.
* `test`: Thêm hoặc cập nhật test scripts, unit test, kịch bản test.
* `chore`: Cấu hình dự án, cài đặt package, cập nhật Docker/Gitignore.

### Ví dụ mẫu chuẩn:
* `feat(backend): [1.6] Khoi tao khung backend NestJS va ket noi PostgreSQL`
* `feat(frontend): [1.7] Dựng khung giao diện React Vite va Tailwind CSS`
* `docs(figma): [1.8] Bo sung link thiet ke Figma va UI Component System`
* `feat(ai): [3.3] Tich hop LLM API phan tich cam xuc va phat hien tu ngu gap rut`
* `fix(email): [2.3] Sua loi timeout khi doc thu tu dong qua Gmail IMAP`

---

## 3. Quy Trình Làm Việc Hàng Ngày Cho Thành Viên (Daily Workflow)

1. **Bắt đầu làm một task**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/1.6-backend-nestjs-init
   ```
2. **Commit công việc thường xuyên**:
   ```bash
   git add .
   git commit -m "feat(backend): [1.6] Cau hinh TypeORM va ket noi CSDL PostgreSQL"
   ```
3. **Đẩy nhánh lên GitHub**:
   ```bash
   git push -u origin feature/1.6-backend-nestjs-init
   ```
4. **Tạo Pull Request (PR) trên GitHub**:
   * Tiêu đề PR: `[1.6] Dựng khung backend NestJS + PostgreSQL`
   * Base branch: `develop` $\leftarrow$ Compare branch: `feature/1.6-backend-nestjs-init`
   * Mô tả nội dung đã làm, đính kèm ảnh chụp màn hình hoặc log test.
   * Gán Reviewer: **Võ Ngọc Phú** (Lead Dev) và **Trương Đình Thảo Đoan** (QA).
5. **Review & Merge**:
   * Khi code được review và QA xác nhận đạt chuẩn Definition of Done (DoD), PR sẽ được merge vào `develop`.
   * Cập nhật trạng thái Task trên Jira sang cột **DONE**.

---

## 4. Tiêu Chuẩn Hoàn Thành (Definition of Done - DoD)
Một task chỉ được coi là hoàn thành (DONE) khi thỏa mãn:
1. Code chạy không lỗi trên môi trường local (không crash server/client).
2. Code đã được commit và merge vào nhánh `develop` thông qua Pull Request.
3. Không commit file nhạy cảm (`.env`, mật khẩu, API keys) lên GitHub.
4. QA (Đoan) kiểm thử và xác nhận chức năng hoạt động đúng yêu cầu nghiệp vụ.
5. Log time đầy đủ trên Jira tương ứng với thời lượng thực tế.

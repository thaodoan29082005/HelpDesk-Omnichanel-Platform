function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
export function buildWebformConfirmationEmail(
  customerName: string,
  ticketCode: string,
): string {
  return `
    <h2>Xác nhận tiếp nhận yêu cầu hỗ trợ</h2>
    <p>Xin chào ${escapeHtml(customerName)},</p>
    <p>Chúng tôi đã tiếp nhận yêu cầu hỗ trợ của bạn.</p>
    <p><strong>Mã yêu cầu:</strong> ${escapeHtml(ticketCode)}</p>
    <p>Đội ngũ hỗ trợ sẽ phản hồi trong thời gian sớm nhất.</p>
    <p>Trân trọng,<br>Đội ngũ HelpDesk</p>
  `;
}
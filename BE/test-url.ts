import { emailTemplates } from "./helpers/email-template.helper";

// Giả lập môi trường Docker
process.env.FRONTEND_URL = "http://localhost";
process.env.DOMAIN_FRONTEND = undefined;

console.log("--- TEST LOGIC TẠO URL TRONG EMAIL ---");
const testEmail = emailTemplates.companyApproved("Công ty Thử Nghiệm");

console.log("Subject:", testEmail.subject);
console.log("Kiểm tra nội dung HTML có chứa URL đúng không...");

if (testEmail.html.includes("http://localhost/company-manage/profile")) {
    console.log("✅ THÀNH CÔNG: URL đã trỏ về http://localhost");
} else {
    console.log("❌ THẤT BẠI: URL vẫn bị sai.");
    // In ra đoạn HTML chứa link để debug
    const linkMatch = testEmail.html.match(/href="([^"]+)"/);
    if (linkMatch) {
        console.log("URL tìm thấy trong HTML là:", linkMatch[1]);
    }
}

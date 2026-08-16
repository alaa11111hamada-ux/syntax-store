import { formatPrice } from "@/lib/format";

const STORE_NAME = "سينتاックス Store";
const BRAND_COLOR = "#f97316";
const BG_COLOR = "#09090f";
const SURFACE_COLOR = "#14141d";
const FG_COLOR = "#ededf2";
const MUTED_COLOR = "#9a9aab";
const UNSUBSCRIBE_URL = "#";

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:${BG_COLOR};font-family:Cairo,Segoe UI,Tahoma,Arial,sans-serif;color:${FG_COLOR};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${SURFACE_COLOR};border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_COLOR},#ea580c);padding:28px 24px;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;">${STORE_NAME}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 24px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #2a2a3a;padding:20px 24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:${MUTED_COLOR};">
                &copy; ${new Date().getFullYear()} ${STORE_NAME}. جميع الحقوق محفوظة.
              </p>
              <p style="margin:8px 0 0;font-size:11px;">
                <a href="${UNSUBSCRIBE_URL}" style="color:${BRAND_COLOR};text-decoration:none;">إلغاء الاشتراك</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 16px;font-size:20px;font-weight:800;color:${FG_COLOR};">${text}</h2>`;
}

function para(text: string, style?: string): string {
  return `<p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:${MUTED_COLOR};${style ?? ""}">${text}</p>`;
}

function boldPara(text: string): string {
  return `<p style="margin:0 0 12px;font-size:14px;line-height:1.8;color:${FG_COLOR};font-weight:700;">${text}</p>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,${BRAND_COLOR},#ea580c);color:#fff;padding:12px 32px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:700;margin-top:8px;">${label}</a>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #2a2a3a;margin:20px 0;" />`;
}

type OrderEmailData = {
  orderNumber: string;
  items: { name: string; priceCents: number; qty: number }[];
  totalCents: number;
  customerName: string;
};

export function orderConfirmationEmail(order: OrderEmailData): string {
  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:10px 0;font-size:14px;color:${FG_COLOR};">${i.name} &times; ${i.qty}</td>
          <td style="padding:10px 0;font-size:14px;color:${FG_COLOR};text-align:left;direction:ltr;">${formatPrice(i.priceCents * i.qty)}</td>
        </tr>`
    )
    .join("");

  const body = `
    ${heading("تأكيد الطلب")}
    ${para(`مرحباً ${order.customerName},`)}
    ${para("تم استلام طلبك بنجاح وبنعمل عليه دلوقتي.")}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr style="border-bottom:1px solid #2a2a3a;">
        <td style="padding:8px 0;font-size:13px;color:${MUTED_COLOR};">المنتج</td>
        <td style="padding:8px 0;font-size:13px;color:${MUTED_COLOR};text-align:left;direction:ltr;">المبلغ</td>
      </tr>
      ${itemsHtml}
    </table>

    ${divider()}

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:6px 0;font-size:16px;font-weight:800;color:${FG_COLOR};">الإجمالي</td>
        <td style="padding:6px 0;font-size:16px;font-weight:800;color:${BRAND_COLOR};text-align:left;direction:ltr;">${formatPrice(order.totalCents)}</td>
      </tr>
    </table>

    ${para(`رقم الطلب: <strong style="color:${FG_COLOR};">${order.orderNumber}</strong>`)}
    ${para("هنوصلك إشعار حال ما الطلب يتجهّز.")}
  `;

  return wrap(body);
}

type StatusEmailData = {
  orderNumber: string;
  status: string;
  customerName: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة",
  confirmed: "مؤكّد",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  returned: "مرتجع",
};

export function orderStatusEmail(order: StatusEmailData): string {
  const label = STATUS_LABELS[order.status] ?? order.status;

  const body = `
    ${heading("تحديث حالة الطلب")}
    ${para(`مرحباً ${order.customerName},`)}
    ${para(`تم تحديث حالة طلبك <strong style="color:${FG_COLOR};">${order.orderNumber}</strong> إلى:`)}
    <div style="text-align:center;margin:20px 0;">
      <span style="display:inline-block;background:${BRAND_COLOR}22;color:${BRAND_COLOR};padding:10px 28px;border-radius:12px;font-size:16px;font-weight:800;">${label}</span>
    </div>
    ${para("لو عندك أي سؤال، تقدر تتواصل معنا.")}
  `;

  return wrap(body);
}

type DeliveryEmailData = {
  orderNumber: string;
  customerName: string;
  downloadLinks: { name: string; url: string }[];
  orderUrl?: string;
};

export function deliveryEmail(order: DeliveryEmailData): string {
  const linksHtml = order.downloadLinks
    .map(
      (l) =>
        `<tr>
          <td style="padding:8px 0;font-size:14px;color:${FG_COLOR};">${l.name}</td>
          <td style="padding:8px 0;text-align:left;font-size:13px;color:${MUTED_COLOR};">جاهز للتحميل</td>
        </tr>`
    )
    .join("");

  const body = `
    ${heading("جاهز للتحميل 🎉")}
    ${para(`مرحباً ${order.customerName},`)}
    ${para(`طلبك <strong style="color:${FG_COLOR};">${order.orderNumber}</strong> جاهز! يمكنك تحميل الملفات من حسابك:`)}

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};border-radius:12px;padding:4px;margin:16px 0;">
      <tr style="border-bottom:1px solid #2a2a3a;">
        <td style="padding:8px 12px;font-size:13px;color:${MUTED_COLOR};">الملف</td>
        <td style="padding:8px 12px;font-size:13px;color:${MUTED_COLOR};text-align:left;">الحالة</td>
      </tr>
      ${linksHtml}
    </table>

    <div style="text-align:center;margin:24px 0;">
      <a href="${order.orderUrl || '#'}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">تحميل المنتجات</a>
    </div>

    ${para("سجّل دخولك بنفس الحساب اللي طلبت بيه عشان تقدر تحميل الملفات. الروابط خاصة بحسابك ولا تنتهي.")}
  `;

  return wrap(body);
}

export function passwordResetEmail(name: string, resetLink: string): string {
  const body = `
    ${heading("إعادة تعيين كلمة السر")}
    ${para(`مرحباً ${name},`)}
    ${para("طلبت إعادة تعيين كلمة السر. اضغط الزر ده عشان تعيّن كلمة سر جديدة.")}

    <div style="text-align:center;margin:24px 0;">
      ${btn(resetLink, "إعادة تعيين كلمة السر")}
    </div>

    ${para("لو أنت اللي طلبت ده، اgnore الرسالة دي. الرابط صالح لمدة ساعة واحدة.")}
  `;

  return wrap(body);
}

export function welcomeEmail(name: string): string {
  const body = `
    ${heading("أهلاً بيك في ${STORE_NAME}!")}
    ${para(`مرحباً ${name},`)}
    ${para("تم إنشاء حسابك بنجاح! تقدر دلوقتي تتسوّق وتطلب بسهولة.")}

    <div style="text-align:center;margin:24px 0;">
      ${btn("/#products", "ابدأ التسوّق")}
    </div>

    ${para("لو عندك أي سؤال، تقدر تتواصل معنا في أي وقت.")}
  `;

  return wrap(body);
}

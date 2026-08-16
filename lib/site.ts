export const site = {
  name: "سينتاكس Store",
  nameSuffix: "",
  tagline: "منتجاتك الرقمية في مكان واحد",
  description: "متجر بسيط وسريع تبيع بيه منتجاتك الرقمية بصفر عمولة.",
  nav: [
    { label: "المنتجات", href: "/#products" },
    { label: "تتبّع طلب", href: "/track" },
  ],
  contactEmail: "hello@example.com",
  whatsapp: "201000000000",
  payment: {
    walletNumber: "0100 000 0000",
    walletName: "سينتاكس Store",
    bankAccount: "EG00 0000 0000 0000 0000",
    instapay: "syntax@instapay",
    note: "بعد التحويل، ارفع صورة الإيصال عشان نأكّد طلبك بسرعة.",
  },
  minOrderCents: 0,
} as const;

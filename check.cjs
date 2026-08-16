const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const r = await p.setting.findUnique({ where: { key: "store_description" } });
  console.log("DB value:", JSON.stringify(r));
  await p.$disconnect();
})();

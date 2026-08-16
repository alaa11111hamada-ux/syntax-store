const {PrismaClient} = require('./node_modules/.prisma/client');
const p = new PrismaClient();
p.setting.findUnique({where:{key:'store_description'}})
  .then(r => console.log(JSON.stringify(r)))
  .finally(() => { p.$disconnect(); });

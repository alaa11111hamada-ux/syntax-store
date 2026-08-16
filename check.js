const { PrismaClient } = require('./app/generated/prisma');
const p = new PrismaClient();
p.product.findMany({select:{id:true,name:true,images:true,fileUrl:true,files:true},take:3}).then(r=>{
  console.log(JSON.stringify(r,null,2));
  process.exit(0);
}).catch(e=>{
  console.error(e.message);
  process.exit(1);
});

import{PrismaClient}from"@prisma/client";const p=new PrismaClient();const r=await p.setting.findUnique({where:{key:"store_description"}});console.log(JSON.stringify(r));await p.$disconnect()

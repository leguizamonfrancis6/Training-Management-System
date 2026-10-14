import { prisma } from "./src/lib/prisma";
prisma.rutina.findFirst({ select: { alumnoId: true } }).then((r) => { console.log(r?.alumnoId); return prisma.$disconnect(); });

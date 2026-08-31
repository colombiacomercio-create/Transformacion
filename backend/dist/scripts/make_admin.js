"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const emails = process.argv.slice(2);
async function main() {
    if (emails.length === 0) {
        console.error('Por favor, proporciona al menos un correo electrónico. Ejemplo: npx ts-node src/scripts/make_admin.ts usuario@ejemplo.com');
        process.exit(1);
    }
    for (const email of emails) {
        try {
            const usuario = await prisma.usuario.upsert({
                where: { email },
                update: { rol: 'ADMIN' },
                create: {
                    email,
                    nombre: email.split('@')[0].replace('.', ' '), // Nombre base si se crea por primera vez
                    rol: 'ADMIN',
                }
            });
            console.log(`✅ Permisos de administrador concedidos a: ${usuario.email}`);
        }
        catch (error) {
            console.error(`❌ Error actualizando a ${email}:`, error);
        }
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});

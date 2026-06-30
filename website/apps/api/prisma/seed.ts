import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // -------------------------------------------------------------------------
  // Admin account
  // -------------------------------------------------------------------------
  const adminEmail = 'admin@reaxone.com';
  const adminPassword = 'ReaxOne2024!';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hashed = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashed,
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'ReaxOne',
      },
    });
    console.log('✅ Conta admin criada:');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('   ⚠️  Muda a password depois do primeiro login!');
  } else {
    console.log('ℹ️  Conta admin já existe, nada a fazer.');
  }

  // -------------------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------------------
  const catBolas = await prisma.category.upsert({
    where: { slug: 'material-desportivo' },
    update: {},
    create: { name: 'Material Desportivo', slug: 'material-desportivo' },
  });

  // Ebooks: produtos digitais entregues por email após pagamento
  const catEbooks = await prisma.category.upsert({
    where: { slug: 'ebooks' },
    update: {},
    create: { name: 'Ebooks', slug: 'ebooks' },
  });

  console.log('✅ Categorias criadas/verificadas.');


  // -------------------------------------------------------------------------
  // Settings
  // -------------------------------------------------------------------------
  const settings = [
    { key: 'store_name', value: 'ReaxOne' },
    { key: 'store_email', value: 'geral@reaxone.com' },
    { key: 'mbway_phone', value: '' },
    { key: 'iban', value: '' },
    { key: 'shipping_free_above', value: '50' },
    { key: 'shipping_flat_rate', value: '3.99' },
  ];

  for (const s of settings) {
    await prisma.settings.upsert({
      where: { key: s.key },
      update: {},
      create: { id: s.key, key: s.key, value: s.value },
    });
  }

  console.log('✅ Configurações inicializadas.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

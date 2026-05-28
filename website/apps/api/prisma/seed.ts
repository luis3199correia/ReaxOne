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
    where: { slug: 'acessorios' },
    update: {},
    create: { name: 'Acessórios', slug: 'acessorios' },
  });

  const catRoupa = await prisma.category.upsert({
    where: { slug: 'roupa' },
    update: {},
    create: { name: 'Roupa', slug: 'roupa' },
  });

  console.log('✅ Categorias criadas/verificadas.');

  // -------------------------------------------------------------------------
  // Products
  // -------------------------------------------------------------------------
  const products = [
    {
      name: 'Bola de Reação Verde',
      slug: 'bola-reacao-verde',
      description:
        'A Bola de Reação ReaxOne foi desenvolvida para treinar reflexos, coordenação e velocidade de resposta. O design irregular garante ressaltos imprevisíveis para um treino mais eficaz.',
      price: 14.99,
      images: [
        '/images/produtos/bola-reacao-verde-splash.jpg',
        '/images/produtos/bola-reacao-verde-padel.jpg',
      ],
      stock: 50,
      categoryId: catBolas.id,
    },
    {
      name: 'Bola de Reação Verde — Padel',
      slug: 'bola-reacao-verde-padel',
      description:
        'Desenvolvida especificamente para treinos de padel. Treina o teu tempo de reação e melhora a coordenação olho-mão dentro e fora da court.',
      price: 14.99,
      images: [
        '/images/produtos/bola-reacao-verde-padel.jpg',
        '/images/produtos/bola-reacao-verde-splash.jpg',
      ],
      stock: 35,
      categoryId: catBolas.id,
    },
    {
      name: 'Bola de Reação Branca',
      slug: 'bola-reacao-branca',
      description:
        'A versão branca da nossa bola de reação premium. Ideal para treinos indoor e outdoor, com o mesmo desempenho e durabilidade da linha verde.',
      price: 14.99,
      images: [
        '/images/produtos/bola-reacao-branca-splash.jpg',
        '/images/produtos/bola-reacao-branca-mao.jpg',
      ],
      stock: 40,
      categoryId: catBolas.id,
    },
    {
      name: 'Bola de Reação Branca — Pack Duplo',
      slug: 'bola-reacao-branca-pack',
      description:
        'Pack com duas bolas de reação brancas. Ideal para treinar com um parceiro ou ter sempre uma de reserva. Poupa 15% face à compra individual.',
      price: 24.99,
      images: [
        '/images/produtos/bola-reacao-branca-mao.jpg',
        '/images/produtos/bola-reacao-branca-splash.jpg',
      ],
      stock: 20,
      categoryId: catBolas.id,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { price: p.price, stock: p.stock, images: p.images },
      create: p,
    });
  }

  console.log('✅ Produtos criados/verificados.');

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

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

  // Ebooks: produtos digitais entregues por email após pagamento
  const catEbooks = await prisma.category.upsert({
    where: { slug: 'ebooks' },
    update: {},
    create: { name: 'Ebooks', slug: 'ebooks' },
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

  // -------------------------------------------------------------------------
  // Ebooks — Coleção Padel ReaxOne® (Por João Roso)
  // ebookFile: preencher com o caminho do PDF após upload dos ficheiros
  // -------------------------------------------------------------------------
  const ebooks = [
    {
      name: 'Padel Sem Lesões — Casa',
      slug: 'padel-sem-lesoes-casa',
      description:
        'O teu corpo é o teu melhor equipamento. Treina em casa, joga sem medo. 8 semanas de treino físico criado por um Personal Trainer e Treinador de Padel para fortaleceres o corpo, prevenires as lesões mais comuns no padel e melhorares a tua resistência — sem sair de casa, sem material. Inclui treino de reação com ReaxOne® e referências científicas em cada capítulo.',
      price: 5.99,
      images: ['/images/ebooks/padel-sem-lesoes-casa.jpg'],
      stock: 9999, // produto digital — sem limite de stock
      categoryId: catEbooks.id,
      ebookFile: 'uploads/ebooks/padel-sem-lesoes-casa.pdf', // preencher após upload
    },
    {
      name: 'Padel Sem Lesões Pro — Ginásio',
      slug: 'padel-sem-lesoes-pro-ginasio',
      description:
        'O ginásio ao serviço do teu padel. Leva o teu padel para o ginásio. Programa de 8 semanas que aproveita máquinas e pesos livres para construíres uma base física sólida, prevenires lesões e melhorares a tua performance em campo. Inclui protocolo completo de treino de reação com ReaxOne® e fundamentação científica em cada exercício.',
      price: 5.99,
      images: ['/images/ebooks/padel-sem-lesoes-pro-ginasio.jpg'],
      stock: 9999,
      categoryId: catEbooks.id,
      ebookFile: 'uploads/ebooks/padel-sem-lesoes-pro-ginasio.pdf',
    },
    {
      name: 'Pack Amador — Padel Sem Lesões (Casa + Ginásio)',
      slug: 'pack-amador-padel-sem-lesoes',
      description:
        'Casa + ginásio. Treina onde estiveres, sem desculpas. O Pack Amador inclui os dois ebooks da linha Padel Sem Lesões — o programa de casa e o programa de ginásio — a um preço especial. Poupa 2 € face à compra individual.',
      price: 9.99,
      images: ['/images/ebooks/pack-amador.jpg'],
      stock: 9999,
      categoryId: catEbooks.id,
      ebookFile: 'uploads/ebooks/pack-amador-padel-sem-lesoes.pdf', // PDF com os dois ebooks em conjunto
    },
    {
      name: 'Padel Performance — Casa',
      slug: 'padel-performance-casa',
      description:
        'Para quem compete, treina a sério. 6 semanas de treino intenso em casa, desenhado para jogadores que competem socialmente ou na federação. Força, potência, agilidade e treino cognitivo-motor com ReaxOne® — tudo o que precisas para subires de nível, sem saíres de casa.',
      price: 8.99,
      images: ['/images/ebooks/padel-performance-casa.jpg'],
      stock: 9999,
      categoryId: catEbooks.id,
      ebookFile: 'uploads/ebooks/padel-performance-casa.pdf',
    },
    {
      name: 'Padel Performance Pro — Ginásio',
      slug: 'padel-performance-pro-ginasio',
      description:
        'Treina como joga: para vencer. A preparação física dos jogadores que querem ganhar. 6 semanas de treino de alta intensidade em ginásio — força máxima, potência explosiva, velocidade e o protocolo ReaxOne® mais avançado de toda a coleção.',
      price: 8.99,
      images: ['/images/ebooks/padel-performance-pro-ginasio.jpg'],
      stock: 9999,
      categoryId: catEbooks.id,
      ebookFile: 'uploads/ebooks/padel-performance-pro-ginasio.pdf',
    },
    {
      name: 'Pack Competidor — Padel Performance (Casa + Ginásio)',
      slug: 'pack-competidor-padel-performance',
      description:
        'Casa + ginásio. Performance total, sem limites. O Pack Competidor reúne os dois ebooks da linha Padel Performance — o programa de casa e o programa de ginásio de alta intensidade — a um preço especial. Poupa 3 € face à compra individual.',
      price: 14.99,
      images: ['/images/ebooks/pack-competidor.jpg'],
      stock: 9999,
      categoryId: catEbooks.id,
      ebookFile: 'uploads/ebooks/pack-competidor-padel-performance.pdf',
    },
  ];

  for (const e of ebooks) {
    await prisma.product.upsert({
      where: { slug: e.slug },
      update: { price: e.price, images: e.images, ebookFile: e.ebookFile },
      create: e,
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

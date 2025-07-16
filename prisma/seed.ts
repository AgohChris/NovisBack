import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Créer un utilisateur par défaut
  const hashedPassword = await hash('password123', 10);
  
  const defaultUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      firstname: 'Super',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log('Created default user:', {
    email: defaultUser.email,
    name: defaultUser.name,
    firstname: defaultUser.firstname,
    role: defaultUser.role,
  });

  // Créer quelques espaces de test
  const espaces = await Promise.all([
    prisma.espace.create({
      data: {
        name: 'Salle de Réunion A',
        description: 'Salle de réunion équipée pour 10 personnes',
        type: 'SALLE_REUNION',
        capacite: 10,
        localisation: 'Bâtiment A - 2ème étage',
        tarif_horaire: 50,
        tarif_journalier: 350,
        tarif_semaine: 1500,
        tarif_mensuel: 5000,
        is_available: true,
      },
    }),
    prisma.espace.create({
      data: {
        name: 'Bureau Privé B1',
        description: 'Bureau privé pour 2-3 personnes',
        type: 'BUREAU_PRIVE',
        capacite: 3,
        localisation: 'Bâtiment B - 1er étage',
        tarif_horaire: 25,
        tarif_journalier: 150,
        tarif_semaine: 600,
        tarif_mensuel: 2000,
        is_available: true,
      },
    }),
    prisma.espace.create({
      data: {
        name: 'Espace Coworking',
        description: 'Espace ouvert pour le travail collaboratif',
        type: 'OPEN_SPACE',
        capacite: 20,
        localisation: 'Bâtiment C - RDC',
        tarif_horaire: 15,
        tarif_journalier: 80,
        tarif_semaine: 350,
        tarif_mensuel: 1200,
        is_available: true,
      },
    }),
  ]);

  console.log('Created test spaces:', espaces.length);

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
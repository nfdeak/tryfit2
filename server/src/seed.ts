import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const passwordHash = await bcrypt.hash('harshit123', 12);

  const user = await prisma.user.upsert({
    where: { username: 'harshit' },
    update: {},
    create: {
      username: 'harshit',
      name: 'Harshit',
      passwordHash,
      onboardingDone: false
    }
  });

  console.log(`Seeded user: ${user.username} (id: ${user.id})`);
  console.log('Login: username=harshit, password=harshit123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

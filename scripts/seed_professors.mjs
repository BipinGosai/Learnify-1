import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { professorsTable } from '../config/schema.js';

// Run with: node scripts/seed_professors.mjs (DATABASE_URL required)

const pg = neon(process.env.DATABASE_URL);
const db = drizzle({ client: pg });

const seedData = [
	{
		email: 'magaranuj22@gmail.com',
		name: 'Dr Anuj',
		specializations: ['Python', 'JavaScript', 'HTML', 'SQL'],
		bio: 'Full-stack engineer and curriculum lead; focuses on pragmatic Python and JS learning paths.',
		isVerified: true,
	},
	{
		email: 'magaranuj55@gmail.com',
		name: 'Magar',
		specializations: ['Java', 'TypeScript', 'React', 'Node.js', 'Go'],
		bio: 'Polyglot backend/frontend developer with emphasis on typed stacks (Java/TS/Go) and production reliability.',
		isVerified: true,
	},
	{
		email: 'data.science@example.com',
		name: 'Priya Nair',
		specializations: ['Kotlin', 'Swift', 'Rust'],
		bio: 'Mobile and systems specialist; blends Kotlin/Swift app craft with Rust performance and safety.',
		isVerified: true,
	},
	{
		email: 'web.ux@example.com',
		name: 'Emma Rodriguez',
		specializations: ['Solidity', 'Dart', 'CSS', 'UI/UX'],
		bio: 'Frontend/UI engineer with blockchain and Flutter experience; champions accessibility and UX polish.',
		isVerified: true,
	},
];

async function main() {
	if (!process.env.DATABASE_URL) {
		console.error('Missing DATABASE_URL environment variable.');
		process.exit(1);
	}

	console.log('Seeding professors...');

	try {
		const upserted = await db
			.insert(professorsTable)
			.values(seedData)
			.onConflictDoUpdate({
				target: professorsTable.email,
				set: {
					name: sql`excluded.name`,
					specializations: sql`excluded.specializations`,
					bio: sql`excluded.bio`,
					isVerified: sql`excluded."isVerified"`,
				},
			})
			.returning({ email: professorsTable.email });

		console.log(`Upserted ${upserted.length} professors.`);
	} catch (err) {
		console.error('Failed to seed professors:', err);
		process.exit(1);
	}

	process.exit(0);
}

main();

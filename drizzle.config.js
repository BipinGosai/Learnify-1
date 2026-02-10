
import { defineConfig } from 'drizzle-kit';

// Drizzle migration config for the Postgres database.
export default defineConfig({ out: './drizzle',
  schema: './config/schema.js',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Get database URL from environment variable
const databaseUrl = import.meta.env.VITE_DATABASE_URL

if (!databaseUrl) {
  console.warn('VITE_DATABASE_URL is not set. Database features will not work.')
}

// Create neon client
const sql = databaseUrl ? neon(databaseUrl) : null

// Create drizzle instance
export const db = sql ? drizzle(sql, { schema }) : null

// Export a function to check if database is available
export function isDatabaseAvailable() {
  return db !== null
}

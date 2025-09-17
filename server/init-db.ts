import { db } from './db';
import { sql } from 'drizzle-orm';
import { exec } from 'child_process';
import { promisify } from 'util';
import { seedDatabase } from './seed';

const execAsync = promisify(exec);

/**
 * Database initialization script to ensure all tables exist
 * Prevents registration failures due to missing database tables
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🔍 Checking database tables...');
    
    // Check if users table exists
    const result = await db.execute(
      sql`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );`
    );
    
    const tableExists = result.rows[0]?.exists;
    
    if (!tableExists) {
      console.log('📊 Database tables not found. Running migrations...');
      
      try {
        // Run database migrations
        await execAsync('npx drizzle-kit migrate');
        console.log('✅ Database migrations completed successfully');
      } catch (error) {
        console.error('❌ Failed to run database migrations:', error);
        throw error;
      }
    } else {
      console.log('✅ Database tables already exist');
    }
    
    // Verify critical tables exist
    const criticalTables = ['users', 'products', 'status_updates', 'transactions'];
    for (const table of criticalTables) {
      const checkResult = await db.execute(
        sql`SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        );`
      );
      
      if (!checkResult.rows[0]?.exists) {
        throw new Error(`Critical table '${table}' does not exist`);
      }
    }
    
    console.log('✅ All critical database tables verified');
    
    // Seed the database with initial data if it's empty
    await seedDatabase();
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
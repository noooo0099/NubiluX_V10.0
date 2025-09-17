import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Check if we're in development environment (includes hosted environments like Replit)
// More robust check that covers various development scenarios
const isDevelopment = process.env.NODE_ENV !== 'production';

// Configure WebSocket with SSL certificate handling
class CustomWebSocket extends ws {
  constructor(url: string | URL, protocols?: string | string[], options?: any) {
    const wsOptions = {
      ...(options || {}),
      // Bypass SSL verification for development environments with self-signed certificates
      rejectUnauthorized: false
    };
    
    if (isDevelopment) {
      console.warn('SSL verification disabled for development WebSocket');
    }
    
    super(url as any, protocols as any, wsOptions);
  }
}

// Use custom WebSocket with SSL bypassing for all development environments
neonConfig.webSocketConstructor = isDevelopment ? CustomWebSocket : ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure SSL for database connection
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ...(isDevelopment && {
    ssl: {
      rejectUnauthorized: false
    }
  })
};

export const pool = new Pool(poolConfig);
export const db = drizzle({ client: pool, schema });
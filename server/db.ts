import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Check if we're in true local development (not hosted environments)
const isLocalDev = process.env.NODE_ENV === 'development' && !process.env.REPL_SLUG && !process.env.REPLIT_DEV_DOMAIN;

// Configure WebSocket with SSL certificate handling
class CustomWebSocket extends ws {
  constructor(url: string | URL, protocols?: string | string[], options?: any) {
    const wsOptions = {
      ...(options || {}),
      // Only bypass SSL verification for local development with self-signed certificates
      rejectUnauthorized: false
    };
    
    if (isLocalDev) {
      console.warn('SSL verification disabled for local dev WebSocket');
    }
    
    super(url as any, protocols as any, wsOptions);
  }
}

// Always provide a WebSocket constructor; use custom only for local dev
neonConfig.webSocketConstructor = isLocalDev ? CustomWebSocket : ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
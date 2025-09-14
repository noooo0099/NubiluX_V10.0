import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket with SSL certificate handling for development
class CustomWebSocket extends ws {
  constructor(url: string, options?: any) {
    const wsOptions = {
      ...options,
      rejectUnauthorized: false // Allow self-signed certificates in development
    };
    super(url, wsOptions);
  }
}

neonConfig.webSocketConstructor = CustomWebSocket;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
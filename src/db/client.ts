import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-serverless";
import { drizzle as nodePostgresDrizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "@/db/schema";
import { config } from "@/lib/config";

function createDatabase() {
  if (process.env.DATABASE_DRIVER === "pg") {
    const pool = new pg.Pool({
      connectionString: config.databaseUrl,
      max: 2,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    return nodePostgresDrizzle({ client: pool, schema });
  }

  const pool = new NeonPool({
    connectionString: config.databaseUrl,
    max: 2,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  return neonDrizzle({ client: pool, schema });
}

export const db = createDatabase();

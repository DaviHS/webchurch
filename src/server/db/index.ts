import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import { env } from "@/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
// const globalForDb = globalThis as unknown as {
//   conn: ReturnType<typeof neon>;
// };

// const conn = globalForDb.conn ?? neon(env.DATABASE_URL);
// if (env.NODE_ENV !== "production") globalForDb.conn = conn;
const conn = neon(env.DATABASE_URL!);

export const db = drizzle(conn, { schema });
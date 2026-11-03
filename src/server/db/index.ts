import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import { env } from "@/env";
import * as schema from "./schema";

const conn = neon(env.DATABASE_URL);

export const db = drizzle(conn, { schema });
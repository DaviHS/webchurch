import "dotenv/config";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const file = process.argv[2];
if (!file) throw new Error("Uso: node scripts/run-sql.ts <arquivo.sql>");

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida (.env).");

const statements = readFileSync(file, "utf8")
  .replace(/--.*$/gm, "")
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

const sql = neon(url);
console.log("Banco:", new URL(url).host);
for (const statement of statements) {
  await sql.query(statement);
  console.log("OK:", statement.split("\n")[0]);
}

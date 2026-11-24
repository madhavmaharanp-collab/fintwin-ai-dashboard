import { defineConfig } from "drizzle-kit";
import path from "path";

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DIRECT_URL or DATABASE_URL must be set for Drizzle");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});

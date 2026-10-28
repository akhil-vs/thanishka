import { getDb } from "../src/db";

// Opening the DB runs migrations + ensureSeeded().
getDb();
console.log("Database ready at", process.env.DATABASE_URL ?? "data/thanishka.db");
console.log("Default admin: admin@thanishka.com / thanishka-admin");

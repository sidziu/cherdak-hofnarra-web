import "dotenv/config";
import { db } from "./prisma/db";

async function main() {
  const runtime = await db.connect({ url: process.env.DATABASE_URL! });

  const orm_query = await db.orm.public.Person.select('name','role').all();
  console.log(orm_query);

  const sql_query = db.sql.public.person.select('name', 'role').build();

  const rows = await runtime.execute(sql_query);
  console.log(rows);

  console.log('Query responds received');

  await runtime.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const result = await mongoose.connection.collection("proposals").deleteMany({});
  console.log("Deleted:", result.deletedCount, "proposals");
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });

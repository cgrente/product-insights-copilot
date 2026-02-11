import "dotenv/config";
import { buildApp } from "./app.js";

const PORT = Number(process.env.PORT ?? 8080);

const app = await buildApp();
app.listen({ port: PORT, host: "0.0.0.0" });

console.log("DEMO_MODE:", process.env.DEMO_MODE);
console.log("HAS_KEY:", Boolean(process.env.OPENAI_API_KEY?.trim()));
console.log("MODEL:", process.env.OPENAI_MODEL);
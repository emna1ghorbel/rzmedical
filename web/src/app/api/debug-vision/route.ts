import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return Response.json({ error: "No GROQ_API_KEY" }, { status: 500 });

  // List all models available on this Groq account
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const json = await res.json();
  // Return only id + owned_by for readability
  const models = (json.data ?? []).map((m: { id: string; owned_by: string }) => ({
    id: m.id,
    owner: m.owned_by,
  }));

  return Response.json({ total: models.length, models }, { status: 200 });
}

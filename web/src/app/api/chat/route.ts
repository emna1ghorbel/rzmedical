import {
  getBrands,
  getMe,
  getMyInvoices,
  getMyOrders,
  getVisibleCategories,
  searchProducts,
} from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_TOOL_ROUNDS = 4; // évite les boucles infinies d'appels d'outils

async function groqChat(body: Record<string, unknown>) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY n'est pas configurée.");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur Groq (${response.status}): ${error}`);
  }

  return response.json();
}

const SYSTEM_PROMPT = `Tu es "RZBot", l'assistant virtuel intelligent de RZMedical — une entreprise tunisienne spécialisée dans la vente d'équipements et consommables médico-dentaires professionnels.

Ton rôle :
- Aider les clients à trouver les bons produits dans le catalogue.
- Répondre aux questions sur les équipements médicaux, dentaires, etc.
- Donner des conseils professionnels.

Règles importantes :
- TU DOIS UTILISER LES OUTILS (Fonctions) fournis pour chercher des produits, des prix, des catégories ou des marques avant de répondre à une question sur le catalogue. Ne devine jamais les prix ou le stock.
- Quand tu appelles search_products, utilise un mot-clé court et simple (1 à 2 mots), pas la phrase complète du client.
- Ne dis jamais que tu ne peux pas chercher dans la base de données, utilise toujours les outils.
- Réponds TOUJOURS en français, de façon professionnelle et chaleureuse.
- Reste concis (max 3 paragraphes).
- Ne donne jamais de conseils médicaux directs.
- Les prix que l'outil te donne sont en TND (Dinars Tunisiens).
- IMPORTANT : À chaque fois que tu mentionnes un produit spécifique issu de ta recherche, tu DOIS inclure ce tag exact dans ta réponse pour afficher une carte produit : [PRODUCT|Nom exact du produit|Prix|Reference]
  Exemple : "Nous avons le tensiomètre. [PRODUCT|Tensiomètre Omron M3|150|REF-OMR-M3]"
- À la fin de chaque réponse, propose toujours 1 ou 2 questions pertinentes en utilisant ce tag : [SUGGESTION|Question]
  RÈGLE STRICTE : la question doit être écrite du point de vue du CLIENT, à la première personne, comme s'il tapait lui-même ce message dans le chat. Ce n'est PAS toi qui poses la question au client.
  INTERDIT (formulation à la 2e personne, comme si toi tu demandais) : "Souhaitez-vous connaître nos horaires d'ouverture ?"
  CORRECT (le client parle) : "Quels sont vos horaires d'ouverture ?"
  Autres exemples corrects : "[SUGGESTION|Avez-vous d'autres marques ?] [SUGGESTION|Quels sont les frais de livraison ?] [SUGGESTION|Ce produit est-il disponible en stock ?]"
- Si l'outil ne trouve rien, excuse-toi poliment et propose d'autres termes de recherche plus génériques.
- Si un outil renvoie une erreur d'authentification, explique poliment au client qu'il doit se connecter à son compte pour accéder à cette information.
`;

export interface ChatMessage {
  role: "user" | "model" | "assistant" | "system" | "tool";
  content: string;
}

// Déclaration des outils au format OpenAI/Groq
const tools = [
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Recherche des produits dans la base de données RZMedical. Utile pour vérifier la disponibilité, le prix, et les caractéristiques d'un produit (ex: tensiomètre, fauteuil dentaire, gants).",
      parameters: {
        type: "object",
        properties: {
          q: {
            type: "string",
            description:
              "Le mot clé de recherche. Utilise un seul mot ou des termes simples (ex: 'tensiomètre', 'gants latex').",
          },
        },
        required: ["q"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_categories",
      description:
        "Récupère la liste des catégories de produits disponibles (ex: Équipements Médicaux, Consommables).",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_brands",
      description: "Récupère la liste des marques vendues par RZMedical.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_profile",
      description: "Récupère le profil du client actuellement connecté.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_orders",
      description: "Récupère les commandes du client actuellement connecté.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_invoices",
      description: "Récupère les factures du client actuellement connecté.",
      parameters: { type: "object", properties: {} },
    },
  },
];

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

async function executeTool(
  functionName: string,
  rawArgs: string,
  clientToken?: string,
): Promise<unknown> {
  let args: Record<string, unknown> = {};
  try {
    args = rawArgs ? JSON.parse(rawArgs) : {};
  } catch {
    // arguments malformés : on continue avec un objet vide plutôt que de planter
  }

  if (functionName === "search_products") {
    const q = typeof args.q === "string" && args.q.trim() ? args.q.trim() : "";
    if (!q) throw new Error("Le paramètre 'q' est requis pour search_products.");
    const products = await searchProducts(q);
    return products
      .map((p) => ({
        nom: p.nom,
        reference: p.reference,
        prix: Number(p.prix),
        disponible: p.disponible,
        remise: Number(p.remise),
        marque: p.marque?.nom,
        categorie: p.sousCategorie?.categorie?.nom,
      }))
      .slice(0, 10);
  }

  if (functionName === "get_categories") {
    return (await getVisibleCategories()).map((category) => category.nom);
  }

  if (functionName === "get_brands") {
    return (await getBrands()).map((brand) => brand.nom);
  }

  // À partir d'ici, tous les outils nécessitent un client connecté.
  if (!clientToken) {
    return { error: "Le client doit se connecter pour accéder à cette information." };
  }

  if (functionName === "get_my_profile") {
    const profile = await getMe(clientToken);
    return {
      prenom: profile.prenom,
      nom: profile.nom,
      email: profile.email,
      telephone: profile.telephone,
      adresse: profile.adresse,
      activite: profile.activite,
    };
  }
  if (functionName === "get_my_orders") return getMyOrders(clientToken);
  if (functionName === "get_my_invoices") return getMyInvoices(clientToken);

  throw new Error(`Outil inconnu: ${functionName}`);
}

async function runToolCall(toolCall: ToolCall, clientToken?: string) {
  const { name, arguments: rawArgs } = toolCall.function;
  let result: unknown;
  try {
    result = await executeTool(name, rawArgs, clientToken);
  } catch (error) {
    result = { error: error instanceof Error ? error.message : "Erreur lors de l'exécution de l'outil." };
  }
  return {
    role: "tool" as const,
    tool_call_id: toolCall.id,
    content: JSON.stringify(result),
  };
}

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages array" }), {
        status: 400,
      });
    }

    const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    const clientToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    const groqMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({
        role: m.role === "model" ? "assistant" : m.role,
        content: m.content,
      })),
    ];

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let finalText: string | undefined;

          for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
            const response = await groqChat({
              model: GROQ_MODEL,
              messages: groqMessages,
              tools,
              tool_choice: "auto",
              stream: false,
            });

            const choice = response.choices?.[0];
            const message = choice?.message;
            const toolCalls: ToolCall[] | undefined = message?.tool_calls;

            if (!toolCalls || toolCalls.length === 0) {
              finalText = message?.content;
              break;
            }

            // On ajoute le message assistant contenant les tool_calls à l'historique
            groqMessages.push({
              role: "assistant",
              content: message.content ?? null,
              tool_calls: toolCalls,
            });

            // On exécute tous les outils demandés (potentiellement en parallèle)
            const toolResults = await Promise.all(
              toolCalls.map((tc) => runToolCall(tc, clientToken)),
            );
            groqMessages.push(...toolResults);
          }

          if (!finalText) {
            // Sécurité si on a atteint MAX_TOOL_ROUNDS sans réponse finale
            const fallback = await groqChat({
              model: GROQ_MODEL,
              messages: [
                ...groqMessages,
                {
                  role: "system",
                  content: "Réponds maintenant au client avec les informations déjà obtenues, sans appeler d'autre outil.",
                },
              ],
              stream: false,
            });
            finalText = fallback.choices?.[0]?.message?.content;
          }

          if (finalText) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: finalText })}\n\n`));
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Erreur Groq";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal Server Error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
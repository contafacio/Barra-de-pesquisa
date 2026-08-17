// Worker principal do projeto Barra de Pesquisa.
// Serve a página (busca-jornada-cliente.html e demais arquivos estáticos) e,
// além disso, responde nas rotas /api/materiais para guardar/ler os
// materiais compartilhados no KV (binding MATERIAIS_KV).

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/materiais") {
      return handleMateriaisApi(request, env);
    }

    // Qualquer outra rota: serve os arquivos estáticos normalmente.
    return env.ASSETS.fetch(request);
  }
};

async function handleMateriaisApi(request, env) {
  const corsHeaders = { "content-type": "application/json" };

  if (request.method === "GET") {
    try {
      const stored = await env.MATERIAIS_KV.get("materiais_data");
      if (!stored) {
        return new Response(JSON.stringify({ docs: null, lastUpdated: null }), { headers: corsHeaders });
      }
      return new Response(stored, { headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Falha ao ler dados: " + err.message }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  if (request.method === "POST") {
    try {
      const body = await request.text();
      const parsed = JSON.parse(body);
      if (!parsed || !Array.isArray(parsed.docs)) {
        return new Response(JSON.stringify({ error: "Formato inválido" }), {
          status: 400,
          headers: corsHeaders
        });
      }
      await env.MATERIAIS_KV.put("materiais_data", body);
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Falha ao salvar: " + err.message }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
}

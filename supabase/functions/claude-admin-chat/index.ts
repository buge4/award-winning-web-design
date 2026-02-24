import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, conversation_history } = await req.json();
    const apiKey = Deno.env.get("CLAUDE_ADMIN_API_KEY");
    if (!apiKey) throw new Error("CLAUDE_ADMIN_API_KEY not configured");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("http://89.167.102.46:3000/api/claude-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Key": apiKey,
      },
      body: JSON.stringify({ message, conversation_history }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      console.error("Claude API error:", response.status, text);
      return new Response(JSON.stringify({ error: `Claude API error: ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("claude-admin-chat error:", e);
    const isTimeout = e instanceof DOMException && e.name === "AbortError";
    return new Response(
      JSON.stringify({ error: isTimeout ? "Request timed out after 30 seconds" : (e instanceof Error ? e.message : "Unknown error") }),
      { status: isTimeout ? 504 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

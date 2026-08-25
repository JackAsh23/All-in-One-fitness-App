/**
 * Cloudflare Worker — Strava OAuth token exchange (keeps client_secret off the web app).
 *
 * Deploy: wrangler deploy workers/strava-token.js
 * Secrets: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET
 *
 * Set VITE_STRAVA_TOKEN_PROXY to your worker URL in the web app build.
 */
export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: cors });
    }

    try {
      const body = await request.json();
      const payload = {
        client_id: env.STRAVA_CLIENT_ID,
        client_secret: env.STRAVA_CLIENT_SECRET,
        grant_type: body.grant_type,
        code: body.code,
        refresh_token: body.refresh_token,
        redirect_uri: body.redirect_uri,
      };

      const tokenRes = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      return new Response(await tokenRes.text(), {
        status: tokenRes.status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ message: String(error) }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  },
};

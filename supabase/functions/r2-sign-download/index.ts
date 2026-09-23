// r2-sign-download: returns a presigned GET URL for private R2 objects.
// Secrets: R2_ACCOUNT_ID, R2_PRIVATE_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_S3_ENDPOINT
import { createClient } from "npm:@supabase/supabase-js@2";

const PRIVATE_PREFIXES = ["documentos-motorista/"];

function hmac(key: Uint8Array, data: string): Promise<Uint8Array> {
  return crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  ).then((k) => crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data)));
}

async function sha256(data: Uint8Array | string): Promise<Uint8Array> {
  const buf = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
}

function toHex(u8: Uint8Array): string {
  return Array.from(u8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

async function signGetUrl(opts: {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  key: string;
  expiresIn: number;
}): Promise<string> {
  const { endpoint, region, accessKeyId, secretAccessKey, bucket, key, expiresIn } = opts;
  const host = new URL(endpoint).host;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = toHex(await sha256(new Uint8Array(0)));
  const canonicalUri = `/${encodeRfc3986(bucket)}/${key.split("/").map(encodeRfc3986).join("/")}`;

  const headers = [
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join("\n");

  const canonicalQuery = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${accessKeyId}/${dateStamp}/${region}/s3/aws4_request`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(expiresIn)],
    ["X-Amz-SignedHeaders", "host;x-amz-content-sha256;x-amz-date"],
  ]
    .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
    .join("&");

  const canonicalRequest = [
    "GET",
    canonicalUri,
    canonicalQuery,
    headers,
    "host;x-amz-content-sha256;x-amz-date",
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    toHex(await sha256(canonicalRequest)),
  ].join("\n");

  const kDate = await hmac(new TextEncoder().encode("AWS4" + secretAccessKey), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, "s3");
  const kSigning = await hmac(kService, "aws4_request");
  const signature = toHex(await hmac(kSigning, stringToSign));

  return `${endpoint}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405, headers: cors });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await admin.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });
    }

    const body = await req.json();
    const key: string = String(body?.key || "").replace(/^\/+/, "");

    if (!key || key.includes("..") || key.startsWith("/")) {
      return new Response(JSON.stringify({ error: "invalid key" }), { status: 400, headers: cors });
    }
    if (!PRIVATE_PREFIXES.some((p) => key.startsWith(p))) {
      return new Response(JSON.stringify({ error: "prefix not allowed" }), { status: 403, headers: cors });
    }

    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID")!;
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
    const endpoint = Deno.env.get("R2_S3_ENDPOINT")!;
    const bucket = Deno.env.get("R2_PRIVATE_BUCKET") || "resolveao-private";

    const url = await signGetUrl({
      endpoint,
      region: "auto",
      accessKeyId,
      secretAccessKey,
      bucket,
      key,
      expiresIn: 300,
    });

    return new Response(JSON.stringify({ url, key }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: cors });
  }
});

import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

async function loadLocalEnv() {
  try {
    const file = await readFile(join(__dirname, ".env"), "utf8");
    for (const line of file.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value.replace(/^["']|["']$/g, "");
      }
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

await loadLocalEnv();

const port = Number(process.env.PORT ?? 4175);
const dataDir = join(__dirname, "data");
const enquiriesFile = join(dataDir, "enquiries.json");
const distDir = join(__dirname, "dist");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
const supabaseTable = process.env.SUPABASE_ENQUIRIES_TABLE ?? "enquiries";
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://127.0.0.1:5174,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const rateLimitWindowMs = 15 * 60 * 1000;
const rateLimitMaxRequests = 5;
const rateLimitStore = new Map();
const resendApiKey = process.env.RESEND_API_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const enquiryFromEmail =
  process.env.ENQUIRY_FROM_EMAIL ?? "Vintage Enquiries <onboarding@resend.dev>";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
};

async function readEnquiries() {
  try {
    const file = await readFile(enquiriesFile, "utf8");
    return JSON.parse(file);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function saveEnquiry(enquiry) {
  if (supabaseUrl && supabaseKey) {
    return saveSupabaseEnquiry(enquiry);
  }

  await mkdir(dataDir, { recursive: true });
  const enquiries = await readEnquiries();
  const saved = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...enquiry,
  };
  enquiries.unshift(saved);
  await writeFile(enquiriesFile, JSON.stringify(enquiries, null, 2));
  return saved;
}

async function supabaseRequest(path, options = {}) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(payload?.message ?? "Supabase request failed.");
    if (payload?.message?.includes("row-level security")) {
      error.statusCode = 403;
      error.publicMessage =
        "Supabase blocked this enquiry. Run the latest supabase-schema.sql in your Supabase SQL editor.";
    }
    if (payload?.message?.includes("submit_enquiry")) {
      error.statusCode = 500;
      error.publicMessage =
        "Supabase is missing the submit_enquiry function. Run the latest supabase-schema.sql in your Supabase SQL editor.";
    }
    throw error;
  }

  return payload;
}

async function readSupabaseEnquiries() {
  return supabaseRequest(
    `${supabaseTable}?select=*&order=created_at.desc`,
  );
}

async function saveSupabaseEnquiry(enquiry) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return saveSupabaseEnquiryWithRpc(enquiry);
  }

  const rows = await supabaseRequest(supabaseTable, {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      name: enquiry.name,
      email: enquiry.email,
      message: enquiry.message,
    }),
  });
  return rows[0];
}

async function saveSupabaseEnquiryWithRpc(enquiry) {
  return supabaseRequest("rpc/submit_enquiry", {
    method: "POST",
    body: JSON.stringify({
      enquiry_name: enquiry.name,
      enquiry_email: enquiry.email,
      enquiry_message: enquiry.message,
    }),
  });
}

function sendJson(res, statusCode, payload) {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
  };
  if (res.allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = res.allowedOrigin;
    headers.Vary = "Origin";
  }
  res.writeHead(statusCode, {
    ...headers,
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20_000) {
        req.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.socket.remoteAddress ?? "unknown";
}

function isRateLimited(key) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > rateLimitMaxRequests;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateEnquiry(enquiry) {
  if (!enquiry.name || !enquiry.email || !enquiry.message) {
    return "Name, email, and details are required.";
  }
  if (enquiry.name.length > 120) {
    return "Name is too long.";
  }
  if (enquiry.email.length > 254 || !isValidEmail(enquiry.email)) {
    return "Enter a valid email address.";
  }
  if (enquiry.message.length > 2000) {
    return "Details must be 2000 characters or fewer.";
  }
  return "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendAdminNotification(enquiry, savedEnquiry) {
  if (!resendApiKey || !adminEmail) {
    return { skipped: true };
  }

  const submittedAt =
    savedEnquiry?.created_at ?? savedEnquiry?.createdAt ?? new Date().toISOString();
  const subject = `New Vintage Vineyard Estates enquiry from ${enquiry.name}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#242426">
      <h2 style="margin:0 0 16px">New enquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(enquiry.name)}</p>
      <p><strong>Email:</strong> <a href="mailto:${escapeHtml(enquiry.email)}">${escapeHtml(enquiry.email)}</a></p>
      <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
      <p><strong>Details:</strong></p>
      <div style="white-space:pre-wrap;padding:14px;background:#f8f4ee;border-left:4px solid #99463f">${escapeHtml(enquiry.message)}</div>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: enquiryFromEmail,
      to: [adminEmail],
      reply_to: enquiry.email,
      subject,
      html,
    }),
  });
  const payload = await response.text();

  if (!response.ok) {
    throw new Error(`Admin notification failed: ${payload}`);
  }

  return { skipped: false };
}

async function handleApi(req, res) {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    sendJson(res, 403, { error: "Origin is not allowed." });
    return;
  }
  if (origin) {
    res.allowedOrigin = origin;
  }

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.url === "/api/enquiries" && req.method === "GET") {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      sendJson(res, 404, { error: "Not found." });
      return;
    }
    const enquiries =
      supabaseUrl && supabaseKey
        ? await readSupabaseEnquiries()
        : await readEnquiries();
    sendJson(res, 200, { enquiries });
    return;
  }

  if (req.url === "/api/enquiries" && req.method === "POST") {
    const clientIp = getClientIp(req);
    if (isRateLimited(`enquiry:${clientIp}`)) {
      sendJson(res, 429, { error: "Too many enquiries. Try again later." });
      return;
    }

    const body = await readBody(req);
    const payload = body ? JSON.parse(body) : {};
    if (cleanText(payload.company)) {
      sendJson(res, 202, { enquiry: null });
      return;
    }
    const enquiry = {
      name: cleanText(payload.name),
      email: cleanText(payload.email),
      message: cleanText(payload.message),
    };

    const validationError = validateEnquiry(enquiry);
    if (validationError) {
      sendJson(res, 400, { error: validationError });
      return;
    }

    const saved = await saveEnquiry(enquiry);
    try {
      await sendAdminNotification(enquiry, saved);
    } catch (error) {
      console.error(error);
    }
    sendJson(res, 201, { enquiry: saved });
    return;
  }

  sendJson(res, 404, { error: "Not found." });
}

async function serveStatic(req, res) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(distDir, safePath);

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      filePath = join(distDir, "index.html");
    }
  } catch {
    filePath = join(distDir, "index.html");
  }

  const extension = extname(filePath);
  res.writeHead(200, {
    "Content-Type": contentTypes[extension] ?? "application/octet-stream",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    if (req.url?.startsWith("/api/")) {
      await handleApi(req, res);
      return;
    }
    await serveStatic(req, res);
  } catch (error) {
    console.error(error);
    sendJson(res, error.statusCode ?? 500, {
      error: error.publicMessage ?? "Something went wrong.",
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Vintage backend running at http://127.0.0.1:${port}`);
});

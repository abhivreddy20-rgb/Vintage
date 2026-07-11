const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const enquiryFromEmail =
  process.env.ENQUIRY_FROM_EMAIL ?? "Vintage Vineyard Estates <onboarding@resend.dev>";
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const rateLimitWindowMs = 15 * 60 * 1000;
const rateLimitMaxRequests = 5;
const rateLimitStore = new Map();

function json(statusCode, payload, origin = "") {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }

  return {
    statusCode,
    headers,
    body: JSON.stringify(payload),
  };
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getHeader(headers, name) {
  const key = Object.keys(headers).find(
    (header) => header.toLowerCase() === name.toLowerCase(),
  );
  return key ? headers[key] : "";
}

function getClientIp(event) {
  const forwardedFor = getHeader(event.headers, "x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return event.requestContext?.identity?.sourceIp ?? "unknown";
}

function isAllowedOrigin(event, origin) {
  if (!origin) {
    return true;
  }
  if (allowedOrigins.length === 0) {
    return true;
  }
  const host = getHeader(event.headers, "host");
  const sameSiteOrigin = host ? `https://${host}` : "";
  return origin === sameSiteOrigin || allowedOrigins.includes(origin);
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

async function supabaseRequest(path, options = {}) {
  if (!supabaseUrl || !supabaseKey) {
    const error = new Error("Supabase environment variables are missing.");
    error.statusCode = 500;
    throw error;
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
    if (payload?.message?.includes("submit_enquiry")) {
      error.publicMessage =
        "Supabase is missing the submit_enquiry function. Run supabase-schema.sql.";
    }
    throw error;
  }

  return payload;
}

async function saveEnquiry(enquiry) {
  return supabaseRequest("rpc/submit_enquiry", {
    method: "POST",
    body: JSON.stringify({
      enquiry_name: enquiry.name,
      enquiry_email: enquiry.email,
      enquiry_message: enquiry.message,
    }),
  });
}

async function sendAdminNotification(enquiry, savedEnquiry) {
  if (!resendApiKey || !adminEmail) {
    return { skipped: true };
  }

  const submittedAt =
    savedEnquiry?.created_at ?? savedEnquiry?.createdAt ?? new Date().toISOString();
  const subject = `New Vintage Vineyard Estates enquiry from ${enquiry.name}`;
  const replyHref = `mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(
    `Re: ${subject}`,
  )}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#242426">
      <h2 style="margin:0 0 16px">New enquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(enquiry.name)}</p>
      <p><strong>Email:</strong> <a href="mailto:${escapeHtml(enquiry.email)}">${escapeHtml(enquiry.email)}</a></p>
      <p><a href="${replyHref}" style="display:inline-block;padding:10px 14px;background:#99463f;color:#ffffff;text-decoration:none;border-radius:4px">Reply to customer</a></p>
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

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Admin notification failed (${response.status}): ${text}`);
  }

  return { skipped: false };
}

export async function handler(event) {
  const origin = getHeader(event.headers, "origin");

  if (!isAllowedOrigin(event, origin)) {
    return json(403, { error: "Origin is not allowed." }, origin);
  }

  if (event.httpMethod === "OPTIONS") {
    return json(204, {}, origin);
  }

  if (event.httpMethod === "GET") {
    return json(200, { ok: true }, origin);
  }

  if (event.httpMethod !== "POST") {
    return json(404, { error: "Not found." }, origin);
  }

  try {
    if ((event.body ?? "").length > 20_000) {
      return json(413, { error: "Request body is too large." }, origin);
    }

    const clientIp = getClientIp(event);
    if (isRateLimited(`enquiry:${clientIp}`)) {
      return json(429, { error: "Too many enquiries. Try again later." }, origin);
    }

    const payload = event.body ? JSON.parse(event.body) : {};
    if (cleanText(payload.company)) {
      return json(202, { enquiry: null }, origin);
    }

    const enquiry = {
      name: cleanText(payload.name),
      email: cleanText(payload.email),
      message: cleanText(payload.message),
    };
    const validationError = validateEnquiry(enquiry);
    if (validationError) {
      return json(400, { error: validationError }, origin);
    }

    const saved = await saveEnquiry(enquiry);
    try {
      await sendAdminNotification(enquiry, saved);
    } catch (error) {
      console.error(error);
    }

    return json(201, { enquiry: saved }, origin);
  } catch (error) {
    console.error(error);
    return json(error.statusCode ?? 500, {
      error: error.publicMessage ?? "Something went wrong.",
    }, origin);
  }
}

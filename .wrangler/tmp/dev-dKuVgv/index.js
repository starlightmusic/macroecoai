var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-U7yP55/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/index.js
function generateSessionToken() {
  return crypto.randomUUID();
}
__name(generateSessionToken, "generateSessionToken");
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
__name(isValidEmail, "isValidEmail");
async function getSessionUser(request, env) {
  const sessionToken = request.headers.get("Authorization")?.replace("Bearer ", "") || getCookie(request, "session_token");
  if (!sessionToken) return null;
  try {
    const result = await env.DB.prepare(`
      SELECT u.id, u.email, u.name, u.created_at, u.last_login, u.subscription_status, u.preview_count
      FROM users u 
      JOIN sessions s ON u.id = s.user_id 
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(sessionToken).first();
    return result || null;
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}
__name(getSessionUser, "getSessionUser");
function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const cookie = cookies.find((c) => c.startsWith(`${name}=`));
  return cookie ? cookie.split("=")[1] : null;
}
__name(getCookie, "getCookie");
function setCookie(name, value, maxAge = 7 * 24 * 60 * 60) {
  return `${name}=${value}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict; Path=/`;
}
__name(setCookie, "setCookie");
async function handleAuthRegister(request, env) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  try {
    const { name, email } = await request.json();
    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    const existingUser = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existingUser) {
      return new Response(JSON.stringify({ error: "User already exists with this email" }), {
        status: 409,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    const result = await env.DB.prepare(`
      INSERT INTO users (email, name, created_at) 
      VALUES (?, ?, datetime('now'))
    `).bind(email, name).run();
    const userId = result.meta.last_row_id;
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
    await env.DB.prepare(`
      INSERT INTO sessions (token, user_id, expires_at) 
      VALUES (?, ?, ?)
    `).bind(sessionToken, userId, expiresAt.toISOString()).run();
    const user = {
      id: userId,
      email,
      name,
      subscription_status: "none",
      preview_count: 0
    };
    return new Response(JSON.stringify({
      success: true,
      user,
      session_token: sessionToken
    }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Set-Cookie": setCookie("session_token", sessionToken)
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(JSON.stringify({ error: "Registration failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
__name(handleAuthRegister, "handleAuthRegister");
async function handleAuthLogin(request, env) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  try {
    const { email } = await request.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    await env.DB.prepare(`
      UPDATE users SET last_login = datetime('now') WHERE id = ?
    `).bind(user.id).run();
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
    await env.DB.prepare(`
      INSERT INTO sessions (token, user_id, expires_at) 
      VALUES (?, ?, ?)
    `).bind(sessionToken, user.id, expiresAt.toISOString()).run();
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_status: user.subscription_status || "none",
        preview_count: user.preview_count || 0
      },
      session_token: sessionToken
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Set-Cookie": setCookie("session_token", sessionToken)
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ error: "Login failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
__name(handleAuthLogin, "handleAuthLogin");
async function handleAuthLogout(request, env) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  try {
    const sessionToken = request.headers.get("Authorization")?.replace("Bearer ", "") || getCookie(request, "session_token");
    if (sessionToken) {
      await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(sessionToken).run();
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Set-Cookie": setCookie("session_token", "", 0)
        // Clear cookie
      }
    });
  } catch (error) {
    console.error("Logout error:", error);
    return new Response(JSON.stringify({ error: "Logout failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
__name(handleAuthLogout, "handleAuthLogout");
async function handleAuthMe(request, env) {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  try {
    const user = await getSessionUser(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return new Response(JSON.stringify({ error: "Authentication check failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
__name(handleAuthMe, "handleAuthMe");
async function handleAuthIncrementPreview(request, env) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  try {
    const user = await getSessionUser(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    const result = await env.DB.prepare(`
      UPDATE users 
      SET preview_count = preview_count + 1 
      WHERE id = ?
    `).bind(user.id).run();
    const updatedUser = await env.DB.prepare(`
      SELECT preview_count FROM users WHERE id = ?
    `).bind(user.id).first();
    return new Response(JSON.stringify({
      success: true,
      preview_count: updatedUser.preview_count
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    console.error("Increment preview error:", error);
    return new Response(JSON.stringify({ error: "Failed to increment preview count" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
__name(handleAuthIncrementPreview, "handleAuthIncrementPreview");
async function handleWorldBankAPI(request) {
  try {
    const response = await fetch("https://search.worldbank.org/api/v3/wds?format=json&owner=EMFMD&fl=count,txturl&strdate=2024-01-01&rows=100");
    if (!response.ok) {
      throw new Error(`World Bank API error: ${response.status}`);
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  } catch (error) {
    console.error("World Bank API error:", error);
    return new Response(JSON.stringify({
      error: "Failed to fetch World Bank data",
      message: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
__name(handleWorldBankAPI, "handleWorldBankAPI");
async function handleWorldBankTextAPI(request) {
  try {
    const url = new URL(request.url);
    const documentUrl = url.searchParams.get("url");
    console.log("\u{1F50D} WORKERS DEBUG: /api/worldbank/text endpoint called");
    console.log("\u{1F4E5} Query params:", Object.fromEntries(url.searchParams.entries()));
    console.log("\u{1F517} URL parameter:", documentUrl);
    if (!documentUrl) {
      console.log("\u274C No URL parameter provided");
      return new Response(JSON.stringify({ error: "URL parameter is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    console.log("\u{1F4E1} Attempting to fetch:", documentUrl);
    const headers = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/plain,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate",
      "Referer": "https://www.worldbank.org/",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1"
    };
    console.log("\u{1F4E4} Using headers:", headers);
    const response = await fetch(documentUrl, {
      method: "GET",
      headers,
      redirect: "follow"
      // Follow redirects automatically
    });
    console.log("\u{1F4CA} World Bank response status:", response.status);
    console.log("\u{1F4CA} World Bank response ok:", response.ok);
    console.log("\u{1F4CA} World Bank response headers:", Object.fromEntries(response.headers.entries()));
    if (!response.ok) {
      console.log("\u274C World Bank returned error status:", response.status);
      const errorBody = await response.text();
      console.log("\u274C Error response body:", errorBody.substring(0, 500));
      throw new Error(`Document fetch error: ${response.status}`);
    }
    const text = await response.text();
    console.log("\u2705 Successfully fetched text from World Bank, length:", text.length);
    console.log("\u{1F4DD} First 200 chars:", text.substring(0, 200));
    return new Response(text, {
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  } catch (error) {
    console.error("\u274C WORKERS ERROR: Document text fetch error:", error);
    console.error("\u274C Error name:", error.name);
    console.error("\u274C Error message:", error.message);
    return new Response(JSON.stringify({
      error: "Failed to fetch document text",
      message: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
__name(handleWorldBankTextAPI, "handleWorldBankTextAPI");
async function handleWorldBankSummaryAPI(request, env) {
  try {
    const url = new URL(request.url);
    const documentUrl = url.searchParams.get("url");
    console.log("\u{1F916} WORKERS DEBUG: /api/worldbank/summary endpoint called");
    console.log("\u{1F4E5} Query params:", Object.fromEntries(url.searchParams.entries()));
    console.log("\u{1F517} URL parameter:", documentUrl);
    if (!documentUrl) {
      console.log("\u274C No URL parameter provided");
      return new Response(JSON.stringify({ error: "URL parameter is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    console.log("\u{1F4E1} Fetching document text from:", documentUrl);
    const headers = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/plain,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate",
      "Referer": "https://www.worldbank.org/",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1"
    };
    const docResponse = await fetch(documentUrl, {
      method: "GET",
      headers,
      redirect: "follow"
    });
    if (!docResponse.ok) {
      throw new Error(`Document fetch error: ${docResponse.status}`);
    }
    const documentText = await docResponse.text();
    console.log("\u2705 Document fetched, length:", documentText.length);
    console.log("\u{1F916} Generating AI summary with Gemini 1.5 Flash...");
    const geminiApiKey = env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set");
    }
    const prompt = `Please summarize this World Bank economic document in exactly 250 words. Focus on the key economic findings, indicators, policy implications, and outlook. Structure the summary with clear paragraphs for readability. Here is the document text:

${documentText}`;
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.log("\u274C Gemini API error:", geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }
    const geminiResult = await geminiResponse.json();
    const summary = geminiResult.candidates[0].content.parts[0].text;
    console.log("\u2705 AI summary generated, length:", summary.length);
    console.log("\u{1F4DD} Summary preview:", summary.substring(0, 100) + "...");
    return new Response(JSON.stringify({
      summary,
      originalLength: documentText.length,
      summaryLength: summary.length
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  } catch (error) {
    console.error("\u274C WORKERS ERROR: AI summary generation error:", error);
    console.error("\u274C Error name:", error.name);
    console.error("\u274C Error message:", error.message);
    return new Response(JSON.stringify({
      error: "Failed to generate AI summary",
      message: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
__name(handleWorldBankSummaryAPI, "handleWorldBankSummaryAPI");
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    switch (pathname) {
      case "/":
        return env.ASSETS.fetch(new Request(url.origin + "/index.html"));
      case "/subscribe":
        return env.ASSETS.fetch(new Request(url.origin + "/subscribe.html"));
      case "/article":
        return env.ASSETS.fetch(new Request(url.origin + "/article.html"));
      case "/success":
        return env.ASSETS.fetch(new Request(url.origin + "/success.html"));
      case "/api/worldbank":
        return await handleWorldBankAPI(request);
      case "/api/worldbank/text":
        return await handleWorldBankTextAPI(request);
      case "/api/worldbank/summary":
        return await handleWorldBankSummaryAPI(request, env);
      case "/api/auth/register":
        return await handleAuthRegister(request, env);
      case "/api/auth/login":
        return await handleAuthLogin(request, env);
      case "/api/auth/logout":
        return await handleAuthLogout(request, env);
      case "/api/auth/me":
        return await handleAuthMe(request, env);
      case "/api/auth/increment-preview":
        return await handleAuthIncrementPreview(request, env);
      default:
        try {
          return await env.ASSETS.fetch(request);
        } catch (error) {
          return env.ASSETS.fetch(new Request(url.origin + "/index.html"));
        }
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-U7yP55/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-U7yP55/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map

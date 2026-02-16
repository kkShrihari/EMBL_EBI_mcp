import fetch from "node-fetch";

/* ---------- BASE URL ---------- */
export const BASE = "https://www.ebi.ac.uk";

/* ---------- SAFE FETCH ---------- */
export async function fetchJSON(url: string, method = "GET", body?: any) {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();

    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }

    if (!res.ok) {
      return { __error: true, status: res.status, message: json || text, url };
    }

    return json;

  } catch (err: any) {
    return { __error: true, status: 0, message: err.message, url };
  }
}

/* ---------- CLEAN ---------- */
export function clean(value: any, limit = 5): any {
  if (Array.isArray(value)) return value.slice(0, limit).map(v => clean(v, limit));

  if (value && typeof value === "object") {
    const o: any = {};
    for (const [k, v] of Object.entries(value)) {
      const c = clean(v, limit);
      if (c !== null && c !== undefined) o[k] = c;
    }
    return Object.keys(o).length ? o : null;
  }

  return value ?? null;
}

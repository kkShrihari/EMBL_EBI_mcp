import fetch from "node-fetch";

const BASE = "https://www.ebi.ac.uk/QuickGO/services";

/* ---------------- FETCH ---------------- */
async function fetchSmart(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  if (res.status === 404) return { __not_found: true };
  if (!res.ok) throw new Error(`ECO failed (${res.status})`);

  return res.json();
}

/* ---------------- CLEAN ---------------- */
const LIMIT = 5;
function clean(v: any, d = 0): any {
  if (Array.isArray(v))
    return v.map(x => clean(x, d + 1)).slice(0, LIMIT);

  if (v && typeof v === "object") {
    const o: any = {};
    for (const [k, val] of Object.entries(v)) {
      const c = clean(val, d + 1);
      if (c !== null && c !== undefined) o[k] = c;
    }
    return Object.keys(o).length ? o : null;
  }
  return v ?? null;
}

/* ---------------- QUERY ---------------- */
function qs(params: Record<string, any>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) q.set(k, String(v));
  });
  return q.toString() ? `?${q}` : "";
}

/* ---------------- HANDLER ---------------- */
export class ECOHandler {
  async run(args: {
    action:
      | "search"
      | "terms"
      | "get"
      | "ancestors"
      | "children"
      | "descendants"
      | "history"
      | "guidelines"
      | "constraints"
      | "secondaryIds"
      | "xrefs"
      | "xontology"
      | "paths";

    query?: string;
    ids?: string[];
    toIds?: string[];
    page?: number;
    limit?: number;
  }) {
    let url = "";

    switch (args.action) {
      case "search":
        url = `${BASE}/ontology/eco/search${qs({ query: args.query, page: args.page })}`;
        break;

      case "terms":
        url = `${BASE}/ontology/eco/terms${qs({ page: args.page })}`;
        break;

      case "get":
        url = `${BASE}/ontology/eco/terms/${args.ids?.join(",")}`;
        break;

      case "ancestors":
        url = `${BASE}/ontology/eco/terms/${args.ids?.join(",")}/ancestors`;
        break;

      case "children":
        url = `${BASE}/ontology/eco/terms/${args.ids?.join(",")}/children`;
        break;

      case "descendants":
        url = `${BASE}/ontology/eco/terms/${args.ids?.join(",")}/descendants`;
        break;

      case "history":
        url = `${BASE}/ontology/eco/terms/${args.ids?.join(",")}/history`;
        break;

      case "guidelines":
        url = `${BASE}/ontology/eco/terms/${args.ids?.join(",")}/guidelines`;
        break;

      case "constraints":
        url = `${BASE}/ontology/eco/terms/${args.ids?.join(",")}/constraints`;
        break;

      case "secondaryIds":
        url = `${BASE}/ontology/eco/terms/${args.ids?.join(",")}/secondaryids`;
        break;

      case "xrefs":
        url = `${BASE}/ontology/eco/terms/${args.ids?.join(",")}/xrefs`;
        break;

      case "xontology":
        url = `${BASE}/ontology/eco/terms/${args.ids?.join(",")}/xontologyrelations`;
        break;

      case "paths":
        url = `${BASE}/ontology/eco/terms/${args.ids?.join(",")}/paths/${args.toIds?.join(",")}`;
        break;

      default:
        throw new Error("Unknown ECO action");
    }

    const raw = await fetchSmart(url);

    if ((raw as any)?.__not_found) {
      return {
        structuredContent: { action: args.action, data: [] },
        content: [{ type: "text", text: "No ECO data found" }],
      };
    }

    const cleaned = clean(raw);

    const response = {
      action: args.action,
      ids: args.ids ?? null,
      data: cleaned ? [{ id: args.ids?.[0] ?? "eco", payload: cleaned }] : [],
    };

    return {
      structuredContent: response,
      content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
    };
  }
}

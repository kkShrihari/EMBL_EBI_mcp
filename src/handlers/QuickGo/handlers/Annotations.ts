import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/QuickGO/services";

/* ---------------------------------
   LIMITS
---------------------------------- */
const TOP_LIMIT = 3;
const NESTED_LIMIT = 3;

/* ---------------------------------
   SMART FETCH
---------------------------------- */
async function fetchSmart(url: string, method = "GET", body?: any) {
  const res = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 404) return { __not_found: true };
  if (res.status === 422) return null;
  if (!res.ok) throw new Error(`Annotations failed (${res.status})`);

  return res.json();
}

/* ---------------------------------
   CLEANER
---------------------------------- */
function clean(value: any, depth = 0): any {
  if (Array.isArray(value)) {
    const cleaned = value
      .map((v) => clean(v, depth + 1))
      .filter((v) => v !== null)
      .slice(0, NESTED_LIMIT);
    return cleaned.length ? cleaned : null;
  }

  if (value && typeof value === "object") {
    const obj: any = {};
    for (const [k, v] of Object.entries(value)) {
      const cleaned = clean(v, depth + 1);
      if (cleaned !== null) obj[k] = cleaned;
    }
    return Object.keys(obj).length ? obj : null;
  }

  if (value === undefined || value === "") return null;
  return value;
}

/* ---------------------------------
   QUERY BUILDER
---------------------------------- */
function buildQuery(params: Record<string, any>) {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      if (Array.isArray(v)) v.forEach((x) => qs.append(k, String(x)));
      else qs.set(k, String(v));
    }
  });

  const s = qs.toString();
  return s ? `?${s}` : "";
}

/* ---------------------------------
   EXTRACT ANNOTATIONS
---------------------------------- */
function extractAnnotations(raw: any) {
  if (!raw?.results || !Array.isArray(raw.results)) return [];

  return raw.results.map((item: any, idx: number) => ({
    id: String(item.id ?? idx),
    payload: clean(
      {
        geneProductId: item.geneProductId,
        symbol: item.symbol,
        goId: item.goId,
        goName: item.goName,
        goAspect: item.goAspect,
        evidenceCode: item.evidenceCode,
        taxonId: item.taxonId,
        assignedBy: item.assignedBy,
        date: item.date,
      },
      0
    ),
  }));
}

/* ---------------------------------
   HANDLER
---------------------------------- */
export class AnnotationsHandler {
  async run(args: {
    action: "about" | "search" | "stats" | "downloadStats" | "coterms";

    goId?: string;
    geneProductId?: string;
    taxonId?: string;
    aspect?: string;
    evidenceCode?: string;
    page?: number;
    limit?: number;
    similarityThreshold?: number;
  }) {
    let url = "";
    let method: "GET" | "POST" = "GET";

    switch (args.action) {
      /* -------- ABOUT -------- */
      case "about":
        url = `${BASE_URL}/annotation/about`;
        break;

      /* -------- SEARCH -------- */
      case "search": {
        const qs = buildQuery({
          goId: args.goId,
          geneProductId: args.geneProductId,
          taxonId: args.taxonId,
          aspect: args.aspect,
          evidenceCode: args.evidenceCode,
          page: args.page,
          limit: args.limit,
        });
        url = `${BASE_URL}/annotation/search${qs}`;
        break;
      }

      /* -------- STATS -------- */
      case "stats": {
        const qs = buildQuery({
          goId: args.goId,
          taxonId: args.taxonId,
        });
        url = `${BASE_URL}/annotation/stats${qs}`;
        break;
      }

      /* -------- DOWNLOAD STATS -------- */
      case "downloadStats": {
        const qs = buildQuery({
          goId: args.goId,
          taxonId: args.taxonId,
        });
        url = `${BASE_URL}/annotation/downloadStats${qs}`;
        break;
      }

      /* -------- CO-TERMS -------- */
      case "coterms":
        if (!args.goId) throw new Error("goId required");
        url = `${BASE_URL}/annotation/coterms/${args.goId}${buildQuery({
          similarityThreshold: args.similarityThreshold,
        })}`;
        break;

      default:
        throw new Error("Unknown annotations action");
    }

    const raw = await fetchSmart(url, method);

    if (raw && (raw as any).__not_found) {
      const notFound = { action: args.action, data: [] };
      return {
        structuredContent: notFound,
        content: [{ type: "text", text: JSON.stringify(notFound, null, 2) }],
      };
    }

    let data: Array<{ id: string; payload: any }> = [];

    if (args.action === "search") {
      data = extractAnnotations(raw)
        .filter((x) => x.payload !== null)
        .slice(0, TOP_LIMIT);
    }

    if (args.action === "about" || args.action === "stats" || args.action === "downloadStats" || args.action === "coterms") {
      const cleaned = clean(raw, 0);
      data = cleaned ? [{ id: args.goId ?? "meta", payload: cleaned }] : [];
    }

    const meta =
      raw?.pageInfo
        ? {
            page: raw.pageInfo.current,
            total: raw.pageInfo.total,
            perPage: raw.pageInfo.resultsPerPage,
          }
        : undefined;

    const response = { action: args.action, meta, data };

    return {
      structuredContent: response,
      content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
    };
  }
}

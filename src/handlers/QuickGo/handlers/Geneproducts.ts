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
async function fetchSmart(url: string) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) return { __not_found: true };
  if (res.status === 422) return null;
  if (!res.ok) throw new Error(`GeneProducts failed (${res.status})`);

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
   EXTRACT RESULTS
---------------------------------- */
function extractGeneProducts(raw: any) {
  if (!raw?.results || !Array.isArray(raw.results)) return [];

  return raw.results.map((item: any, idx: number) => ({
    id: String(item.id ?? idx),
    payload: clean(
      {
        id: item.id,
        name: item.name,
        symbol: item.symbol,
        taxonId: item.taxonId,
        type: item.type,
        database: item.database,
        proteome: item.proteome,
        synonyms: item.synonyms,
      },
      0
    ),
  }));
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
   HANDLER
---------------------------------- */
export class GeneProductsHandler {
  async run(args: {
    action: "search" | "targetset" | "get";

    query?: string;
    ids?: string[];
    name?: string;

    taxonId?: number[];
    page?: number;
    limit?: number;
    type?: string;
    dbSubset?: string;
    proteome?: string;
  }) {
    let url = "";

    switch (args.action) {
      /* ---------------- SEARCH ---------------- */
      case "search": {
        if (!args.query) throw new Error("query required");

        const qs = buildQuery({
          query: args.query,
          taxonId: args.taxonId,
          page: args.page,
          limit: args.limit,
          type: args.type,
          dbSubset: args.dbSubset,
          proteome: args.proteome,
        });

        url = `${BASE_URL}/geneproduct/search${qs}`;
        break;
      }

      /* ---------------- TARGET SET ---------------- */
      case "targetset": {
        if (!args.name) throw new Error("name required");
        url = `${BASE_URL}/geneproduct/targetset/${encodeURIComponent(
          args.name
        )}`;
        break;
      }

      /* ---------------- IDS ---------------- */
      case "get": {
        if (!args.ids?.length) throw new Error("ids required");
        url = `${BASE_URL}/geneproduct/${args.ids.join(",")}`;
        break;
      }

      default:
        throw new Error("Unknown geneproducts action");
    }

    const raw = await fetchSmart(url);

    if (raw && (raw as any).__not_found) {
      const notFound = {
        action: args.action,
        data: [],
        note: "No gene products found",
      };

      return {
        structuredContent: notFound,
        content: [{ type: "text", text: JSON.stringify(notFound, null, 2) }],
      };
    }

    if (!raw) {
      return {
        content: [{ type: "text", text: "No meaningful data available" }],
      };
    }

    let data: Array<{ id: string; payload: any }> = [];

    if (args.action === "search" || args.action === "targetset" || args.action === "get") {
      data = extractGeneProducts(raw)
        .filter((x) => x.payload !== null)
        .slice(0, TOP_LIMIT);
    }

    const meta =
      raw.pageInfo
        ? {
            page: raw.pageInfo.current,
            total: raw.pageInfo.total,
            perPage: raw.pageInfo.resultsPerPage,
          }
        : undefined;

    const response = {
      action: args.action,
      meta,
      data,
    };

    return {
      structuredContent: response,
      content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
    };
  }
}

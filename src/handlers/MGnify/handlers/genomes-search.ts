import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/metagenomics/api";

/* ---------------------------------
   LIMITS
---------------------------------- */
const TOP_LIMIT = 3;
const NESTED_LIMIT = 3;

/* ---------------------------------
   SMART FETCH (JSON or 404/401)
---------------------------------- */
async function fetchSmart(url: string, options: any = {}) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    ...options,
  });

  if (res.status === 404) return { __not_found: true };
  if (res.status === 401) return { __unauthorized: true };
  if (res.status === 422) return null;
  if (!res.ok)
    throw new Error(`MGnify genomes-search failed (${res.status})`);

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  return { __raw_text: text };
}

/* ---------------------------------
   CLEANER
---------------------------------- */
function clean(value: any, depth = 0): any {
  const limit = NESTED_LIMIT;

  if (Array.isArray(value)) {
    const cleaned = value
      .map((v) => clean(v, depth + 1))
      .filter((v) => v !== null)
      .slice(0, limit);
    return cleaned.length ? cleaned : null;
  }

  if (value && typeof value === "object") {
    const obj: any = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "image_url" || k === "image-url") continue;
      const cleaned = clean(v, depth + 1);
      if (cleaned !== null) obj[k] = cleaned;
    }
    return Object.keys(obj).length ? obj : null;
  }

  if (value === undefined || value === "") return null;
  return value;
}

/* ---------------------------------
   EXTRACT "results" ARRAY
---------------------------------- */
function extractResults(raw: any) {
  if (!raw?.results || !Array.isArray(raw.results)) return [];

  return raw.results.map((item: any, idx: number) => ({
    id: String(idx),
    payload: clean(item, 0),
  }));
}

/* ---------------------------------
   BUILD QUERY STRING
---------------------------------- */
function buildQuery(params: Record<string, any>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/* =================================
   HANDLER
================================= */
export class MGnifyGenomesSearchHandler {
  async run(args: {
    action: "genomes_search_list" | "genomes_search_submit";
    format?: "json" | "csv";
    page?: number;
    page_size?: number;

    // POST only
    file_uploaded?: string;
    mag_catalogue?: string;
  }) {
    let url = "";
    let fetchOptions: any = {};

    switch (args.action) {
      case "genomes_search_list": {
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
        });
        url = `${BASE_URL}/v1/genomes-search/gather${qs}`;
        break;
      }

      case "genomes_search_submit": {
        if (!args.file_uploaded || !args.mag_catalogue)
          throw new Error(
            "file_uploaded and mag_catalogue are required for POST"
          );

        const qs = buildQuery({ format: args.format });
        url = `${BASE_URL}/v1/genomes-search/gather${qs}`;

        const body = new URLSearchParams();
        body.set("file_uploaded", args.file_uploaded);
        body.set("mag_catalogue", args.mag_catalogue);

        fetchOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: body.toString(),
        };
        break;
      }

      default:
        throw new Error("Unknown genomes-search action");
    }

    const raw = await fetchSmart(url, fetchOptions);

    if (raw && (raw as any).__not_found) {
      const notFound = {
        action: args.action,
        data: [],
        note: "Endpoint returned 404",
      };
      return {
        structuredContent: notFound,
        content: [{ type: "text", text: JSON.stringify(notFound, null, 2) }],
      };
    }

    if (raw && (raw as any).__unauthorized) {
      const unauth = {
        action: args.action,
        data: [],
        note: "Authentication required (401)",
      };
      return {
        structuredContent: unauth,
        content: [{ type: "text", text: JSON.stringify(unauth, null, 2) }],
      };
    }

    if (!raw) {
      return {
        content: [{ type: "text", text: "No meaningful data available" }],
      };
    }

    let data: Array<{ id: string; payload: any }> = [];

    if (args.action === "genomes_search_list") {
      data = extractResults(raw).slice(0, TOP_LIMIT);
    }

    if (args.action === "genomes_search_submit") {
      const cleaned = clean(raw, 0);
      data = cleaned
        ? [{ id: "0", payload: cleaned }]
        : [];
    }

    const meta =
      raw.count !== undefined
        ? {
            page: args.page ?? 1,
            count: raw.count,
          }
        : undefined;

    const response = {
      action: args.action,
      file_uploaded: args.file_uploaded ?? null,
      mag_catalogue: args.mag_catalogue ?? null,
      meta,
      data,
    };

    return {
      structuredContent: response,
      content: [
        { type: "text", text: JSON.stringify(response, null, 2) },
      ],
    };
  }
}

import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/metagenomics/api";
const TOP_LIMIT = 3;
const NESTED_LIMIT = 3;

/* ---------------- SMART FETCH ---------------- */
async function fetchSmart(url: string) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) return { __not_found: true };
  if (res.status === 422) return null;
  if (!res.ok) throw new Error(`MGnify cogs failed (${res.status})`);

  return res.json();
}

/* ---------------- CLEANER ---------------- */
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
      const cleaned = clean(v, depth + 1);
      if (cleaned !== null) obj[k] = cleaned;
    }
    return Object.keys(obj).length ? obj : null;
  }

  if (value === undefined || value === "") return null;
  return value;
}

/* ---------------- EXTRACT COG DATA (FIXED) ---------------- */
function extractCogData(raw: any) {
  if (!raw?.data || !Array.isArray(raw.data)) return [];

  return raw.data.map((item: any, idx: number) => ({
    id: String(item.id ?? idx),
    payload: {
      ...item.attributes,
      links: item.links,
    },
  }));
}

/* ---------------- BUILD QUERY ---------------- */
function buildQuery(params: Record<string, any>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/* ---------------- HANDLER ---------------- */
export class MGnifyCogsHandler {
  async run(args: {
    action: "cogs_list" | "cogs_get";
    id?: number;
    format?: "json" | "csv";
    page?: number;
    page_size?: number;
    ordering?: string;
  }) {
    let url = "";

    switch (args.action) {
      case "cogs_list": {
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
        });
        url = `${BASE_URL}/v1/cogs${qs}`;
        break;
      }

      case "cogs_get": {
        if (args.id === undefined)
          throw new Error("id is required for cogs_get");
        const qs = buildQuery({ format: args.format });
        url = `${BASE_URL}/v1/cogs/${args.id}${qs}`;
        break;
      }

      default:
        throw new Error("Unknown cogs action");
    }

    const raw = await fetchSmart(url);

    if (raw && (raw as any).__not_found) {
      const notFound = {
        action: args.action,
        id: args.id ?? null,
        data: [],
        note: `No data found for id=${args.id}`,
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

    if (args.action === "cogs_list") {
      data = extractCogData(raw)
        .map(({ id, payload }) => ({
          id,
          payload: clean(payload, 0),
        }))
        .filter((x) => x.payload !== null)
        .slice(0, TOP_LIMIT);
    }

    if (args.action === "cogs_get") {
      const cleaned = clean(raw, 0);
      data = cleaned
        ? [{ id: String(args.id), payload: cleaned }]
        : [];
    }

    const meta =
      raw.meta?.pagination
        ? {
            page: raw.meta.pagination.page,
            pages: raw.meta.pagination.pages,
            count: raw.meta.pagination.count,
          }
        : undefined;

    const response = {
      action: args.action,
      id: args.id ?? null,
      meta,
      data,
    };

    return {
      structuredContent: response,
      content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
    };
  }
}

import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/metagenomics/api";

/* ---------------------------------
   LIMITS
---------------------------------- */
const TOP_LIMIT = 3;
const NESTED_LIMIT = 3;

/* ---------------------------------
   SMART FETCH (JSON or 404)
---------------------------------- */
async function fetchSmart(url: string) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) return { __not_found: true };
  if (res.status === 422) return null;
  if (!res.ok) throw new Error(`MGnify genomeset failed (${res.status})`);

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
      const cleaned = clean(v, depth + 1);
      if (cleaned !== null) obj[k] = cleaned;
    }
    return Object.keys(obj).length ? obj : null;
  }

  if (value === undefined || value === "") return null;
  return value;
}

/* ---------------------------------
   EXTRACT JSON:API data[]
---------------------------------- */
function extractDataArray(raw: any) {
  if (!raw?.data || !Array.isArray(raw.data)) return [];

  return raw.data.map((item: any, idx: number) => ({
    id: String(item.id ?? idx),
    payload: {
      ...item.attributes,
      relationships: item.relationships,
      links: item.links,
    },
  }));
}

/* ---------------------------------
   BUILD QUERY STRING
---------------------------------- */
function buildQuery(params: Record<string, any>) {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      qs.set(k, String(v));
    }
  });

  const s = qs.toString();
  return s ? `?${s}` : "";
}

/* ---------------------------------
   HANDLER
---------------------------------- */
export class MGnifyGenomeSetHandler {
  async run(args: {
    action:
      | "genomeset_list"
      | "genomeset_get"
      | "genomeset_genomes";

    name?: string;

    format?: "json" | "csv";
    page?: number;
    page_size?: number;
    ordering?: string;
    search?: string;
  }) {
    let url = "";

    switch (args.action) {
      case "genomeset_list": {
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
        });
        url = `${BASE_URL}/v1/genomeset${qs}`;
        break;
      }

      case "genomeset_get": {
        if (!args.name) throw new Error("name is required");
        const qs = buildQuery({ format: args.format });
        url = `${BASE_URL}/v1/genomeset/${args.name}${qs}`;
        break;
      }

      case "genomeset_genomes": {
        if (!args.name) throw new Error("name is required");
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
          search: args.search,
        });
        url = `${BASE_URL}/v1/genomeset/${args.name}/genomes${qs}`;
        break;
      }

      default:
        throw new Error("Unknown genomeset action");
    }

    const raw = await fetchSmart(url);

    if (raw && (raw as any).__not_found) {
      const notFound = {
        action: args.action,
        name: args.name ?? null,
        data: [],
        note: `No data found for name=${args.name}`,
      };

      return {
        structuredContent: notFound,
        content: [
          { type: "text", text: JSON.stringify(notFound, null, 2) },
        ],
      };
    }

    if (!raw) {
      return {
        content: [{ type: "text", text: "No meaningful data available" }],
      };
    }

    let data: Array<{ id: string; payload: any }> = [];

    // Paginated endpoints
    if (
      args.action === "genomeset_list" ||
      args.action === "genomeset_genomes"
    ) {
      data = extractDataArray(raw)
        .map(({ id, payload }) => ({
          id,
          payload: clean(payload, 0),
        }))
        .filter((x): x is { id: string; payload: any } => x.payload !== null)
        .slice(0, TOP_LIMIT);
    }

    // Single object
    if (args.action === "genomeset_get") {
      const cleaned = clean(raw, 0);
      data = cleaned
        ? [{ id: String(args.name), payload: cleaned }]
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
      name: args.name ?? null,
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

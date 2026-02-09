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
  if (!res.ok)
    throw new Error(`MGnify publications failed (${res.status})`);

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  return { __raw_text: text };
}

/* ---------------------------------
   CLEANER (LESS AGGRESSIVE AT ROOT)
---------------------------------- */
function clean(value: any, depth = 0): any {
  const limit = depth === 0 ? 10 : NESTED_LIMIT;

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
      // remove base64 images if they appear
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
export class MGnifyPublicationsHandler {
  async run(args: {
    action:
      | "publications_list"
      | "publications_get"
      | "publications_europe_pmc_annotations"
      | "publications_samples"
      | "publications_studies";

    pubmed_id?: string;

    format?: "json" | "csv";
    page?: number;
    page_size?: number;
    ordering?: string;
  }) {
    let url = "";

    switch (args.action) {
      case "publications_list": {
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
        });
        url = `${BASE_URL}/v1/publications${qs}`;
        break;
      }

      case "publications_get": {
        if (!args.pubmed_id) throw new Error("pubmed_id is required");
        const qs = buildQuery({ format: args.format });
        url = `${BASE_URL}/v1/publications/${args.pubmed_id}${qs}`;
        break;
      }

      case "publications_europe_pmc_annotations": {
        if (!args.pubmed_id) throw new Error("pubmed_id is required");
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
        });
        url = `${BASE_URL}/v1/publications/${args.pubmed_id}/europe_pmc_annotations${qs}`;
        break;
      }

      case "publications_samples": {
        if (!args.pubmed_id) throw new Error("pubmed_id is required");
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
        });
        url = `${BASE_URL}/v1/publications/${args.pubmed_id}/samples${qs}`;
        break;
      }

      case "publications_studies": {
        if (!args.pubmed_id) throw new Error("pubmed_id is required");
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
        });
        url = `${BASE_URL}/v1/publications/${args.pubmed_id}/studies${qs}`;
        break;
      }

      default:
        throw new Error("Unknown publications action");
    }

    const raw = await fetchSmart(url);

    // --- 404 HANDLING ---
    if (raw && (raw as any).__not_found) {
      const notFound = {
        action: args.action,
        pubmed_id: args.pubmed_id ?? null,
        data: [],
        note: `No data found for pubmed_id=${args.pubmed_id}`,
      };

      return {
        structuredContent: notFound,
        content: [
          {
            type: "text",
            text: JSON.stringify(notFound, null, 2),
          },
        ],
      };
    }

    if (!raw) {
      return {
        content: [{ type: "text", text: "No meaningful data available" }],
      };
    }

    let data: Array<{ id: string; payload: any }> = [];

    // --- PAGINATED ENDPOINTS ---
    if (
      args.action === "publications_list" ||
      args.action === "publications_europe_pmc_annotations" ||
      args.action === "publications_samples" ||
      args.action === "publications_studies"
    ) {
      data = extractDataArray(raw)
        .map(({ id, payload }) => ({
          id,
          payload: clean(payload, 0),
        }))
        .filter(
          (x): x is { id: string; payload: any } => x.payload !== null
        )
        .slice(0, TOP_LIMIT);
    }

    // --- SINGLE-OBJECT ENDPOINT ---
    if (args.action === "publications_get") {
      const cleaned = clean(raw, 0);
      data = cleaned
        ? [
            {
              id: String(args.pubmed_id),
              payload: cleaned,
            },
          ]
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
      pubmed_id: args.pubmed_id ?? null,
      meta,
      data,
    };

    return {
      structuredContent: response,
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }
}

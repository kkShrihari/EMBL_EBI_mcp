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
    throw new Error(`MGnify experiment-types failed (${res.status})`);

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  return { __raw_text: text };
}

/* ---------------------------------
   CLEANER (removes image_url etc.)
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
   EXTRACTORS
---------------------------------- */

// For /v1/experiment-types  → uses JSON:API style "data[]"
function extractExperimentTypes(raw: any) {
  if (!raw?.data || !Array.isArray(raw.data)) return [];

  return raw.data.map((item: any, idx: number) => ({
    id: String(item.id ?? idx),
    payload: {
      ...item.attributes,
      links: item.links,
    },
  }));
}

// For endpoints that actually use "results[]"
function extractResults(raw: any) {
  if (!raw?.results || !Array.isArray(raw.results)) return [];

  return raw.results.map((item: any, idx: number) => ({
    id: String(item.accession ?? item.experiment_type ?? idx),
    payload: clean(item, 0),
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
export class MGnifyExperimentTypesHandler {
  async run(args: {
    action:
      | "experiment_types_list"
      | "experiment_types_get"
      | "experiment_types_analyses"
      | "experiment_types_runs"
      | "experiment_types_samples";

    experiment_type?: string;

    format?: "json" | "csv";
    page?: number;
    page_size?: number;
    ordering?: string;
    search?: string;
  }) {
    let url = "";

    switch (args.action) {
      case "experiment_types_list": {
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
        });
        url = `${BASE_URL}/v1/experiment-types${qs}`;
        break;
      }

      case "experiment_types_get": {
        if (!args.experiment_type)
          throw new Error("experiment_type is required");
        const qs = buildQuery({ format: args.format });
        url = `${BASE_URL}/v1/experiment-types/${args.experiment_type}${qs}`;
        break;
      }

      case "experiment_types_analyses": {
        if (!args.experiment_type)
          throw new Error("experiment_type is required");
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
          search: args.search,
        });
        url = `${BASE_URL}/v1/experiment-types/${args.experiment_type}/analyses${qs}`;
        break;
      }

      case "experiment_types_runs": {
        if (!args.experiment_type)
          throw new Error("experiment_type is required");
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
          search: args.search,
        });
        url = `${BASE_URL}/v1/experiment-types/${args.experiment_type}/runs${qs}`;
        break;
      }

      case "experiment_types_samples": {
        if (!args.experiment_type)
          throw new Error("experiment_type is required");
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
          search: args.search,
        });
        url = `${BASE_URL}/v1/experiment-types/${args.experiment_type}/samples${qs}`;
        break;
      }

      default:
        throw new Error("Unknown experiment-types action");
    }

    const raw = await fetchSmart(url);

    if (raw && (raw as any).__not_found) {
      const notFound = {
        action: args.action,
        experiment_type: args.experiment_type ?? null,
        data: [],
        note: `No data found for experiment_type=${args.experiment_type}`,
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

    // LIST uses JSON:API style "data[]"
    if (args.action === "experiment_types_list") {
      data = extractExperimentTypes(raw)
        .map(({ id, payload }) => ({
          id,
          payload: clean(payload, 0),
        }))
        .filter((x) => x.payload !== null)
        .slice(0, TOP_LIMIT);
    }

    // Other endpoints use "results[]"
    if (
      args.action === "experiment_types_analyses" ||
      args.action === "experiment_types_runs" ||
      args.action === "experiment_types_samples"
    ) {
      data = extractResults(raw)
        .filter((x) => x.payload !== null)
        .slice(0, TOP_LIMIT);
    }

    // Single object endpoint
    if (args.action === "experiment_types_get") {
      const cleaned = clean(raw, 0);
      data = cleaned
        ? [
            {
              id: String(args.experiment_type),
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
      experiment_type: args.experiment_type ?? null,
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

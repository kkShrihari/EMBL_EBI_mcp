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
  if (!res.ok) throw new Error(`MGnify runs failed (${res.status})`);

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  return { __raw_text: text };
}

/* ---------------------------------
   CLEANER (LESS AGGRESSIVE)
---------------------------------- */
function clean(value: any, depth = 0): any {
  // Allow more at top level so relationships are not destroyed
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
   (KEEP attributes + relationships + links)
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
export class MGnifyRunsHandler {
  async run(args: {
    action:
      | "runs_list"
      | "runs_get"
      | "runs_analyses"
      | "runs_assemblies"
      | "runs_extra_annotations"
      | "runs_extra_annotation_get";

    accession?: string;
    alias?: string;

    format?: "json" | "csv";
    page?: number;
    page_size?: number;
    ordering?: string;
  }) {
    let url = "";

    switch (args.action) {
      case "runs_list": {
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
        });
        url = `${BASE_URL}/v1/runs${qs}`;
        break;
      }

      case "runs_get": {
        if (!args.accession) throw new Error("accession is required");
        const qs = buildQuery({ format: args.format });
        url = `${BASE_URL}/v1/runs/${args.accession}${qs}`;
        break;
      }

      case "runs_analyses": {
        if (!args.accession) throw new Error("accession is required");
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
        });
        url = `${BASE_URL}/v1/runs/${args.accession}/analyses${qs}`;
        break;
      }

      case "runs_assemblies": {
        if (!args.accession) throw new Error("accession is required");
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
        });
        url = `${BASE_URL}/v1/runs/${args.accession}/assemblies${qs}`;
        break;
      }

      case "runs_extra_annotations": {
        if (!args.accession) throw new Error("accession is required");
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
        });
        url = `${BASE_URL}/v1/runs/${args.accession}/extra-annotations${qs}`;
        break;
      }

      case "runs_extra_annotation_get": {
        if (!args.accession || !args.alias)
          throw new Error("accession and alias are required");
        const qs = buildQuery({ format: args.format });
        url = `${BASE_URL}/v1/runs/${args.accession}/extra-annotations/${args.alias}${qs}`;
        break;
      }

      default:
        throw new Error("Unknown runs action");
    }

    const raw = await fetchSmart(url);

    // --- 404 HANDLING ---
    if (raw && (raw as any).__not_found) {
      const notFound = {
        action: args.action,
        accession: args.accession ?? null,
        alias: args.alias ?? null,
        data: [],
        note: `No data found for accession=${args.accession}`,
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
      args.action === "runs_list" ||
      args.action === "runs_analyses" ||
      args.action === "runs_assemblies" ||
      args.action === "runs_extra_annotations"
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

    // --- SINGLE-OBJECT ENDPOINTS ---
    if (
      args.action === "runs_get" ||
      args.action === "runs_extra_annotation_get"
    ) {
      const cleaned = clean(raw, 0);
      data = cleaned
        ? [
            {
              id: String(args.accession),
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
      accession: args.accession ?? null,
      alias: args.alias ?? null,
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

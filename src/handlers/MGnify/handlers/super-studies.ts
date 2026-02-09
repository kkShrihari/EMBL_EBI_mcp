import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/metagenomics/api";

/* ---------------------------------
   LIMITS
---------------------------------- */
const TOP_LIMIT = 3;
const NESTED_LIMIT = 3;

/* ---------------------------------
   SMART FETCH (JSON OR 404)
---------------------------------- */
async function fetchSmart(url: string) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) return { __not_found: true };
  if (res.status === 422) return null;
  if (!res.ok)
    throw new Error(`MGnify super-studies failed (${res.status})`);

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  // Non-JSON (HTML, ZIP, etc.)
  const text = await res.text();
  return { __raw_text: text };
}

/* ---------------------------------
   CLEANER (DEPTH-LIMITED + REMOVE image-url)
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
      // REMOVE IMAGE FIELDS (both naming styles)
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
    payload: item.attributes ?? item,
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
export class MGnifySuperStudiesHandler {
  async run(args: {
    action:
      | "super_studies_list"
      | "super_studies_get"
      | "super_studies_biomes"
      | "super_studies_flagship"
      | "super_studies_genome_catalogues"
      | "super_studies_related_studies";

    super_study_id?: number | string;

    format?: "json" | "csv";
    page?: number;
    page_size?: number;
    ordering?: string;
    search?: string;

    biome_name?: string;
    description?: string;
    title?: string;
    url_slug?: string;
  }) {
    let url = "";

    switch (args.action) {
      case "super_studies_list": {
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
          search: args.search,
          biome_name: args.biome_name,
          description: args.description,
          title: args.title,
          url_slug: args.url_slug,
          super_study_id: args.super_study_id,
        });

        url = `${BASE_URL}/v1/super-studies${qs}`;
        break;
      }

      case "super_studies_get": {
        if (!args.super_study_id)
          throw new Error("super_study_id is required");

        const qs = buildQuery({ format: args.format });
        url = `${BASE_URL}/v1/super-studies/${args.super_study_id}${qs}`;
        break;
      }

      case "super_studies_biomes": {
        if (!args.super_study_id)
          throw new Error("super_study_id is required");

        const qs = buildQuery({ format: args.format });
        url = `${BASE_URL}/v1/super-studies/${args.super_study_id}/biomes${qs}`;
        break;
      }

      case "super_studies_flagship": {
        if (!args.super_study_id)
          throw new Error("super_study_id is required");

        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
          search: args.search,
        });
        url = `${BASE_URL}/v1/super-studies/${args.super_study_id}/flagship-studies${qs}`;
        break;
      }

      case "super_studies_genome_catalogues": {
        if (!args.super_study_id)
          throw new Error("super_study_id is required");

        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
          search: args.search,
        });
        url = `${BASE_URL}/v1/super-studies/${args.super_study_id}/genome-catalogues${qs}`;
        break;
      }

      case "super_studies_related_studies": {
        if (!args.super_study_id)
          throw new Error("super_study_id is required");

        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
          search: args.search,
        });
        url = `${BASE_URL}/v1/super-studies/${args.super_study_id}/related-studies${qs}`;
        break;
      }

      default:
        throw new Error("Unknown super-studies action");
    }

    const raw = await fetchSmart(url);

    // -------- SPECIAL CASE: genome-catalogues 404 --------
    if (
      args.action === "super_studies_genome_catalogues" &&
      raw &&
      (raw as any).__not_found
    ) {
      const response = {
        action: args.action,
        super_study_id: args.super_study_id ?? null,
        data: [],
        note:
          "Genome-catalogues endpoint is not available for this super-study (404)",
      };

      return {
        structuredContent: response,
        content: [
          { type: "text", text: JSON.stringify(response, null, 2) },
        ],
      };
    }
    // -----------------------------------------------------

    // General 404 for other endpoints
    if (raw && (raw as any).__not_found) {
      const notFound = {
        action: args.action,
        super_study_id: args.super_study_id ?? null,
        data: [],
        note: `No data found for super_study_id=${args.super_study_id}`,
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

    // ---- LIST + paginated sub-resources use raw.data[] ----
    if (
      args.action === "super_studies_list" ||
      args.action === "super_studies_flagship" ||
      args.action === "super_studies_genome_catalogues" ||
      args.action === "super_studies_related_studies"
    ) {
      data = extractDataArray(raw)
        .map(({ id, payload }) => ({
          id,
          payload: clean(payload, 0),
        }))
        .filter(
          (x): x is { id: string; payload: any } =>
            x.payload !== null
        )
        .slice(0, TOP_LIMIT);
    }

    // ---- Single-object endpoints ----
    if (
      args.action === "super_studies_get" ||
      args.action === "super_studies_biomes"
    ) {
      const cleaned = clean(raw, 0);
      data = cleaned
        ? [
            {
              id: String(
                (raw as any).super_study_id ??
                  args.super_study_id ??
                  "0"
              ),
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
      super_study_id: args.super_study_id ?? null,
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

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
  if (!res.ok) throw new Error(`MGnify biomes failed (${res.status})`);

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
   EXTRACT RESULTS (BIOMES)
---------------------------------- */
function extractBiomes(raw: any) {
  if (!raw?.results || !Array.isArray(raw.results)) return [];

  return raw.results.map((item: any, idx: number) => ({
    id: String(item.lineage ?? item.biome_name ?? idx),
    payload: clean(
      {
        biome_name: item.biome_name,
        lineage: item.lineage,
        samples_count: item.samples_count,
        url: item.url,
      },
      0
    ),
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
export class MGnifyBiomesHandler {
  async run(args: {
    action:
      | "biomes_list"
      | "biomes_get"
      | "biomes_children"
      | "biomes_genome_catalogues"
      | "biomes_genomes"
      | "biomes_samples"
      | "biomes_studies"
      | "biomes_top10";

    lineage?: string;

    format?: "json" | "csv";
    page?: number;
    page_size?: number;
    ordering?: string;
    search?: string;
    depth_gte?: number;
    depth_lte?: number;
  }) {
    let url = "";

    switch (args.action) {
      case "biomes_list": {
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
          search: args.search,
        });
        url = `${BASE_URL}/v1/biomes${qs}`;
        break;
      }

      case "biomes_get": {
        if (!args.lineage) throw new Error("lineage is required");
        const qs = buildQuery({ format: args.format });
        url = `${BASE_URL}/v1/biomes/${encodeURIComponent(
          args.lineage
        )}${qs}`;
        break;
      }

      case "biomes_children": {
        if (!args.lineage) throw new Error("lineage is required");
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
          search: args.search,
          depth_gte: args.depth_gte,
          depth_lte: args.depth_lte,
        });
        url = `${BASE_URL}/v1/biomes/${encodeURIComponent(
          args.lineage
        )}/children${qs}`;
        break;
      }

      case "biomes_genome_catalogues": {
        if (!args.lineage) throw new Error("lineage is required");
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
          search: args.search,
        });
        url = `${BASE_URL}/v1/biomes/${encodeURIComponent(
          args.lineage
        )}/genome-catalogues${qs}`;
        break;
      }

      case "biomes_genomes": {
        if (!args.lineage) throw new Error("lineage is required");
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
          search: args.search,
        });
        url = `${BASE_URL}/v1/biomes/${encodeURIComponent(
          args.lineage
        )}/genomes${qs}`;
        break;
      }

      case "biomes_samples": {
        if (!args.lineage) throw new Error("lineage is required");
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
          search: args.search,
        });
        url = `${BASE_URL}/v1/biomes/${encodeURIComponent(
          args.lineage
        )}/samples${qs}`;
        break;
      }

      case "biomes_studies": {
        if (!args.lineage) throw new Error("lineage is required");
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
          search: args.search,
        });
        url = `${BASE_URL}/v1/biomes/${encodeURIComponent(
          args.lineage
        )}/studies${qs}`;
        break;
      }

      case "biomes_top10": {
        const qs = buildQuery({ format: args.format });
        url = `${BASE_URL}/v1/biomes/top10${qs}`;
        break;
      }

      default:
        throw new Error("Unknown biomes action");
    }

    const raw = await fetchSmart(url);

    if (raw && (raw as any).__not_found) {
      const notFound = {
        action: args.action,
        lineage: args.lineage ?? null,
        data: [],
        note: `No data found for lineage=${args.lineage}`,
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

    // List or children-style endpoints use results[]
    if (
      args.action === "biomes_list" ||
      args.action === "biomes_children" ||
      args.action === "biomes_genome_catalogues" ||
      args.action === "biomes_genomes" ||
      args.action === "biomes_samples" ||
      args.action === "biomes_studies"
    ) {
      data = extractBiomes(raw)
        .filter((x) => x.payload !== null)
        .slice(0, TOP_LIMIT);
    }

    // Single-object endpoints
    if (args.action === "biomes_get" || args.action === "biomes_top10") {
      const cleaned = clean(raw, 0);
      data = cleaned
        ? [
            {
              id: String(args.lineage ?? "top10"),
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
      lineage: args.lineage ?? null,
      meta,
      data,
    };

    return {
      structuredContent: response,
      content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
    };
  }
}

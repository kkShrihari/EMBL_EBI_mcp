// import fetch from "node-fetch";

// const BASE_URL = "https://www.ebi.ac.uk/metagenomics/api";

// /* ---------------------------------
//    LIMITS
// ---------------------------------- */
// const TOP_LIMIT = 3;
// const NESTED_LIMIT = 3;

// /* ---------------------------------
//    SAFE FETCH
// ---------------------------------- */
// async function fetchJson(
//   url: string,
//   method: "GET" | "POST" = "GET",
//   body?: any
// ) {
//   const res = await fetch(url, {
//     method,
//     headers: {
//       Accept: "application/json",
//       "Content-Type": "application/json",
//     },
//     body: body ? JSON.stringify(body) : undefined,
//   });

//   if (res.status === 404) return { __not_found: true };
//   if (res.status === 422) return null;
//   if (!res.ok)
//     throw new Error(`MGnify assemblies failed (${res.status})`);

//   return res.json();
// }

// /* ---------------------------------
//    CLEANER (DEPTH-LIMITED)
// ---------------------------------- */
// function clean(value: any, depth = 0): any {
//   const limit = NESTED_LIMIT;

//   if (Array.isArray(value)) {
//     const cleaned = value
//       .map((v) => clean(v, depth + 1))
//       .filter((v) => v !== null)
//       .slice(0, limit);
//     return cleaned.length ? cleaned : null;
//   }

//   if (value && typeof value === "object") {
//     const obj: any = {};
//     for (const [k, v] of Object.entries(value)) {
//       const cleaned = clean(v, depth + 1);
//       if (cleaned !== null) obj[k] = cleaned;
//     }
//     return Object.keys(obj).length ? obj : null;
//   }

//   if (value === undefined || value === "") return null;
//   return value;
// }

// /* ---------------------------------
//    EXTRACT JSON:API ASSEMBLIES (YOUR REAL RESPONSE)
// ---------------------------------- */
// function extractAssemblies(raw: any) {
//   if (!raw?.data || !Array.isArray(raw.data)) return [];

//   return raw.data.map((item: any, idx: number) => {
//     return {
//       id: String(item.id ?? idx),
//       payload: {
//         accession: item.attributes?.accession ?? item.id,
//         experiment_type: item.attributes?.["experiment-type"],
//         is_private: item.attributes?.["is-private"],
//         wgs_accession: item.attributes?.["wgs-accession"],
//         legacy_accession: item.attributes?.["legacy-accession"],
//         coverage: item.attributes?.coverage,
//         min_gap_length: item.attributes?.["min-gap-length"],
//         relationships: item.relationships ?? {},
//         links: item.links ?? {},
//       },
//     };
//   });
// }

// /* ---------------------------------
//    BUILD QUERY STRING
// ---------------------------------- */
// function buildQuery(params: Record<string, any>) {
//   const qs = new URLSearchParams();

//   Object.entries(params).forEach(([k, v]) => {
//     if (v !== undefined && v !== null) {
//       qs.set(k, String(v));
//     }
//   });

//   const s = qs.toString();
//   return s ? `?${s}` : "";
// }

// /* ---------------------------------
//    HANDLER
// ---------------------------------- */
// export class MGnifyAssembliesHandler {
//   async run(args: {
//     action:
//       | "assemblies_list"
//       | "assemblies_get"
//       | "assemblies_analyses"
//       | "assemblies_extra_annotations"
//       | "assemblies_extra_annotation_get"
//       | "assemblies_runs";

//     accession?: string;
//     alias?: string;

//     // common query params
//     format?: "json" | "csv";
//     page?: number;
//     page_size?: number;
//     ordering?: string;

//     // filters for /assemblies
//     biome_name?: string;
//     lineage?: string;
//     metadata_key?: string;
//     metadata_value?: string;
//     metadata_value_gte?: number;
//     metadata_value_lte?: number;
//     run_accession?: string;
//     sample_accession?: string;
//     search?: string;
//     species?: string;
//   }) {
//     let url = "";

//     switch (args.action) {
//       case "assemblies_list": {
//         const qs = buildQuery({
//           format: args.format,
//           page: args.page,
//           page_size: args.page_size,
//           ordering: args.ordering,
//           biome_name: args.biome_name,
//           lineage: args.lineage,
//           metadata_key: args.metadata_key,
//           metadata_value: args.metadata_value,
//           metadata_value_gte: args.metadata_value_gte,
//           metadata_value_lte: args.metadata_value_lte,
//           run_accession: args.run_accession,
//           sample_accession: args.sample_accession,
//           search: args.search,
//           species: args.species,
//         });

//         url = `${BASE_URL}/v1/assemblies${qs}`;
//         break;
//       }

//       case "assemblies_get": {
//         if (!args.accession) {
//           throw new Error("accession is required for assemblies_get");
//         }
//         const qs = buildQuery({ format: args.format });
//         url = `${BASE_URL}/v1/assemblies/${args.accession}${qs}`;
//         break;
//       }

//       case "assemblies_analyses": {
//         if (!args.accession) {
//           throw new Error("accession is required for assemblies_analyses");
//         }
//         const qs = buildQuery({
//           format: args.format,
//           page: args.page,
//           page_size: args.page_size,
//           ordering: args.ordering,
//         });
//         url = `${BASE_URL}/v1/assemblies/${args.accession}/analyses${qs}`;
//         break;
//       }

//       case "assemblies_extra_annotations": {
//         if (!args.accession) {
//           throw new Error(
//             "accession is required for assemblies_extra_annotations"
//           );
//         }
//         const qs = buildQuery({
//           format: args.format,
//           page: args.page,
//           page_size: args.page_size,
//           ordering: args.ordering,
//         });
//         url = `${BASE_URL}/v1/assemblies/${args.accession}/extra-annotations${qs}`;
//         break;
//       }

//       case "assemblies_extra_annotation_get": {
//         if (!args.accession || !args.alias) {
//           throw new Error(
//             "accession and alias are required for assemblies_extra_annotation_get"
//           );
//         }
//         const qs = buildQuery({ format: args.format });
//         url = `${BASE_URL}/v1/assemblies/${args.accession}/extra-annotations/${args.alias}${qs}`;
//         break;
//       }

//       case "assemblies_runs": {
//         if (!args.accession) {
//           throw new Error("accession is required for assemblies_runs");
//         }
//         const qs = buildQuery({
//           format: args.format,
//           page: args.page,
//           page_size: args.page_size,
//           ordering: args.ordering,
//         });
//         url = `${BASE_URL}/v1/assemblies/${args.accession}/runs${qs}`;
//         break;
//       }

//       default:
//         throw new Error("Unknown assemblies action");
//     }

//     const raw = await fetchJson(url, "GET");

//     // Handle 404 cleanly
//     if (raw && (raw as any).__not_found) {
//       const notFound = {
//         action: args.action,
//         accession: args.accession ?? null,
//         alias: args.alias ?? null,
//         data: [],
//         note: `No data found for accession=${args.accession}`,
//       };

//       return {
//         structuredContent: notFound,
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify(notFound, null, 2),
//           },
//         ],
//       };
//     }

//     if (!raw) {
//       return {
//         content: [{ type: "text", text: "No meaningful data available" }],
//       };
//     }

//     let data: Array<{ id: string; payload: any }> = [];

//     // LIST assemblies (JSON:API style)
//     if (args.action === "assemblies_list") {
//       data = extractAssemblies(raw)
//         .map(({ id, payload }) => ({
//           id,
//           payload: clean(payload, 0),
//         }))
//         .filter(
//           (x): x is { id: string; payload: any } =>
//             x.payload !== null
//         )
//         .slice(0, TOP_LIMIT);
//     }

//     // Single assembly GET
//     if (args.action === "assemblies_get") {
//       const cleaned = clean(raw, 0);
//       data = cleaned
//         ? [
//             {
//               id: String(raw.data?.id ?? args.accession ?? "0"),
//               payload: cleaned,
//             },
//           ]
//         : [];
//     }

//     // Other paginated sub-resources
//     if (
//       args.action === "assemblies_analyses" ||
//       args.action === "assemblies_extra_annotations" ||
//       args.action === "assemblies_runs"
//     ) {
//       data = extractAssemblies(raw)
//         .map(({ id, payload }) => ({
//           id,
//           payload: clean(payload, 0),
//         }))
//         .filter(
//           (x): x is { id: string; payload: any } =>
//             x.payload !== null
//         )
//         .slice(0, TOP_LIMIT);
//     }

//     // Single extra-annotation GET
//     if (args.action === "assemblies_extra_annotation_get") {
//       const cleaned = clean(raw, 0);
//       data = cleaned
//         ? [
//             {
//               id: String(args.alias ?? "0"),
//               payload: cleaned,
//             },
//           ]
//         : [];
//     }

//     const meta =
//       raw.meta?.pagination
//         ? {
//             page: raw.meta.pagination.page,
//             pages: raw.meta.pagination.pages,
//             count: raw.meta.pagination.count,
//           }
//         : undefined;

//     const response = {
//       action: args.action,
//       accession: args.accession ?? null,
//       alias: args.alias ?? null,
//       meta,
//       data,
//     };

//     return {
//       structuredContent: response,
//       content: [
//         {
//           type: "text",
//           text: JSON.stringify(response, null, 2),
//         },
//       ],
//     };
//   }
// }








import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/metagenomics/api";

/* ---------------------------------
   LIMITS
---------------------------------- */
const TOP_LIMIT = 3;
const NESTED_LIMIT = 3;

/* ---------------------------------
   SAFE FETCH (SMART: JSON OR TEXT)
---------------------------------- */
async function fetchSmart(url: string) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (res.status === 404) return { __not_found: true };
  if (res.status === 422) return null;
  if (!res.ok)
    throw new Error(`MGnify assemblies failed (${res.status})`);

  // Try JSON first
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  // Otherwise return text (for files like ZIP)
  const text = await res.text();
  return { __raw_text: text };
}

/* ---------------------------------
   CLEANER (DEPTH-LIMITED)
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
   EXTRACT ASSEMBLIES (JSON:API)
---------------------------------- */
function extractAssemblies(raw: any) {
  if (!raw?.data || !Array.isArray(raw.data)) return [];

  return raw.data.map((item: any, idx: number) => {
    return {
      id: String(item.id ?? idx),
      payload: {
        accession: item.attributes?.accession ?? item.id,
        experiment_type: item.attributes?.["experiment-type"],
        is_private: item.attributes?.["is-private"],
        wgs_accession: item.attributes?.["wgs-accession"],
        legacy_accession: item.attributes?.["legacy-accession"],
        coverage: item.attributes?.coverage,
        min_gap_length: item.attributes?.["min-gap-length"],
        relationships: item.relationships ?? {},
        links: item.links ?? {},
      },
    };
  });
}

/* ---------------------------------
   EXTRACT EXTRA-ANNOTATIONS (LIST)
---------------------------------- */
function extractExtraAnnotations(raw: any) {
  if (!raw?.data || !Array.isArray(raw.data)) return [];

  return raw.data.map((item: any, idx: number) => ({
    id: String(item.id ?? idx),
    payload: {
      alias: item.attributes?.alias ?? item.id,
      file_format: item.attributes?.["file-format"],
      description: item.attributes?.description,
      group_type: item.attributes?.["group-type"],
      file_checksum: item.attributes?.["file-checksum"],
      links: item.links ?? {},
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
export class MGnifyAssembliesHandler {
  async run(args: {
    action:
      | "assemblies_list"
      | "assemblies_get"
      | "assemblies_analyses"
      | "assemblies_extra_annotations"
      | "assemblies_extra_annotation_get"
      | "assemblies_runs";

    accession?: string;
    alias?: string;

    format?: "json" | "csv";
    page?: number;
    page_size?: number;
    ordering?: string;
  }) {
    let url = "";

    switch (args.action) {
      case "assemblies_list": {
        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
        });
        url = `${BASE_URL}/v1/assemblies${qs}`;
        break;
      }

      case "assemblies_get": {
        if (!args.accession)
          throw new Error("accession is required for assemblies_get");

        const qs = buildQuery({ format: args.format });
        url = `${BASE_URL}/v1/assemblies/${args.accession}${qs}`;
        break;
      }

      case "assemblies_analyses": {
        if (!args.accession)
          throw new Error("accession is required for assemblies_analyses");

        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
        });
        url = `${BASE_URL}/v1/assemblies/${args.accession}/analyses${qs}`;
        break;
      }

      case "assemblies_extra_annotations": {
        if (!args.accession)
          throw new Error(
            "accession is required for assemblies_extra_annotations"
          );

        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
        });
        url = `${BASE_URL}/v1/assemblies/${args.accession}/extra-annotations${qs}`;
        break;
      }

      case "assemblies_extra_annotation_get": {
        if (!args.accession || !args.alias)
          throw new Error(
            "accession and alias are required for assemblies_extra_annotation_get"
          );

        const qs = buildQuery({ format: args.format });
        url = `${BASE_URL}/v1/assemblies/${args.accession}/extra-annotations/${encodeURIComponent(
          args.alias
        )}${qs}`;
        break;
      }

      case "assemblies_runs": {
        if (!args.accession)
          throw new Error("accession is required for assemblies_runs");

        const qs = buildQuery({
          format: args.format,
          page: args.page,
          page_size: args.page_size,
          ordering: args.ordering,
        });
        url = `${BASE_URL}/v1/assemblies/${args.accession}/runs${qs}`;
        break;
      }

      default:
        throw new Error("Unknown assemblies action");
    }

    const raw = await fetchSmart(url);

    // 404 handling
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

    // -------- SPECIAL CASE: FILE DOWNLOAD (YOUR TEST 05) --------
    if (
      args.action === "assemblies_extra_annotation_get" &&
      (raw as any).__raw_text
    ) {
      const response = {
        action: args.action,
        accession: args.accession ?? null,
        alias: args.alias ?? null,
        data: [
          {
            id: String(args.alias),
            payload: {
              message: "Binary/file content returned (ZIP or similar)",
              size_bytes: (raw as any).__raw_text.length,
              download_url: url,
            },
          },
        ],
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
    // ------------------------------------------------------------

    let data: Array<{ id: string; payload: any }> = [];

    if (args.action === "assemblies_list") {
      data = extractAssemblies(raw)
        .map(({ id, payload }) => ({
          id,
          payload: clean(payload, 0),
        }))
        .filter((x): x is { id: string; payload: any } => x.payload !== null)
        .slice(0, TOP_LIMIT);
    }

    if (args.action === "assemblies_get") {
      const cleaned = clean(raw, 0);
      data = cleaned
        ? [
            {
              id: String(args.accession ?? "0"),
              payload: cleaned,
            },
          ]
        : [];
    }

    if (args.action === "assemblies_extra_annotations") {
      data = extractExtraAnnotations(raw)
        .map(({ id, payload }) => ({
          id,
          payload: clean(payload, 0),
        }))
        .filter((x): x is { id: string; payload: any } => x.payload !== null)
        .slice(0, TOP_LIMIT);
    }

    if (
      args.action === "assemblies_analyses" ||
      args.action === "assemblies_runs"
    ) {
      data = extractAssemblies(raw)
        .map(({ id, payload }) => ({
          id,
          payload: clean(payload, 0),
        }))
        .filter((x): x is { id: string; payload: any } => x.payload !== null)
        .slice(0, TOP_LIMIT);
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

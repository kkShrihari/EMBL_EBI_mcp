import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/metagenomics/api";

/* ---------------------------------
   LIMITS
---------------------------------- */
const TOP_LIMIT = 3;
const NESTED_LIMIT = 3;

/* ---------------------------------
   FETCH SAFE
---------------------------------- */
async function fetchJson(
  url: string,
  method: "GET" | "POST" = "GET",
  body?: any
) {
  const res = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 404) return { __not_found: true };
  if (res.status === 422) return null;
  if (!res.ok)
    throw new Error(`MGnify antiSMASH failed (${res.status})`);

  return res.json();
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
   EXTRACT LIST RESULTS (MATCHES YOUR CURL)
---------------------------------- */
function extractListResults(raw: any) {
  if (raw?.data && Array.isArray(raw.data)) {
    return raw.data.map((item: any, idx: number) => ({
      id: String(item.id ?? idx),
      payload: item,
    }));
  }
  return [];
}

/* ---------------------------------
   HANDLER
---------------------------------- */
export class MGnifyAntiSMASHHandler {
  async run(args: {
    action:
      | "antismash_geneclusters_list"
      | "antismash_geneclusters_get";
    id?: number;
    format?: "json" | "csv";
    page?: number;
    page_size?: number;
    ordering?: string;
  }) {
    let url = "";

    switch (args.action) {
      case "antismash_geneclusters_list": {
        const params = new URLSearchParams();

        if (args.format) params.set("format", args.format);
        if (args.page) params.set("page", String(args.page));
        if (args.page_size)
          params.set("page_size", String(args.page_size));
        if (args.ordering) params.set("ordering", args.ordering);

        const qs = params.toString();
        url = `${BASE_URL}/v1/antismash-geneclusters${
          qs ? "?" + qs : ""
        }`;
        break;
      }

      case "antismash_geneclusters_get":
        if (args.id === undefined) {
          throw new Error(
            "id (integer) is required for antismash_geneclusters_get"
          );
        }

        url = `${BASE_URL}/v1/antismash-geneclusters/${args.id}`;
        if (args.format) url += `?format=${args.format}`;
        break;

      default:
        throw new Error("Unknown MGnify antiSMASH action");
    }

    const raw = await fetchJson(url, "GET");

    // ---------- HANDLE 404 CLEANLY ----------
    if (raw && (raw as any).__not_found) {
      const notFoundResponse = {
        action: args.action,
        id: args.id ?? null,
        meta: undefined,
        data: [],
        note: `No gene cluster found for id=${args.id}`,
      };

      return {
        structuredContent: notFoundResponse,
        content: [
          {
            type: "text",
            text: JSON.stringify(notFoundResponse, null, 2),
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

    if (args.action === "antismash_geneclusters_list") {
      data = extractListResults(raw)
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

    if (args.action === "antismash_geneclusters_get") {
      const cleaned = clean(raw, 0);
      data = cleaned
        ? [
            {
              id: String(raw.id ?? args.id ?? "0"),
              payload: cleaned,
            },
          ]
        : [];
    }

    const meta =
      args.action === "antismash_geneclusters_list"
        ? {
            links: raw.links ?? null,
            meta: raw.meta ?? null,
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
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }
}

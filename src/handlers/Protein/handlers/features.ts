import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/proteins/api";

/* -------------------------------
   HELPERS
--------------------------------*/

function normalizeSize(size?: number) {
  const DEFAULT = 3;
  const MAX = 10;
  return Math.min(size ?? DEFAULT, MAX);
}

function flattenFeatures(data: any): any[] {
  // Case 1: /features/{accession}
  if (data?.features && Array.isArray(data.features)) {
    return data.features;
  }

  // Case 2: /features or /features/type -> array of records
  if (Array.isArray(data)) {
    return data.flatMap(entry =>
      Array.isArray(entry.features) ? entry.features : []
    );
  }

  return [];
}

/* -------------------------------
   HANDLER
--------------------------------*/

export class ProteinFeaturesHandler {
  async run(args: {
    action: "search" | "by_type" | "by_accession";
    query?: string;        // maps to `terms`
    type?: string;         // DOMAIN, REGION, etc.
    organism?: string;     // Homo sapiens
    accession?: string;    // P04637
    size?: number;
  }) {
    const { action, query, type, organism, accession, size } = args;

    let url: string;

    /* ----------------------------------------
       ROUTING
    ---------------------------------------- */
      switch (action) {

      case "search": {
        const params = new URLSearchParams({
          size: String(normalizeSize(size))
        });

        if (type) params.set("types", type);
        if (query) params.set("terms", query);
        if (organism) params.set("organism", organism);

        url = `${BASE_URL}/features?${params.toString()}`;
        break;
      }

      case "by_type": {
        if (!type) {
          throw new Error("type is required for features by_type");
        }

        /* ---- API requires terms; fallback if missing ---- */
        if (!query) {
          const params = new URLSearchParams({
            types: type,
            size: String(normalizeSize(size))
          });

          if (organism) params.set("organism", organism);

          url = `${BASE_URL}/features?${params.toString()}`;
          break;
        }

        const params = new URLSearchParams({
          terms: query,
          size: String(normalizeSize(size))
        });

        if (organism) params.set("organism", organism);

        url = `${BASE_URL}/features/type/${encodeURIComponent(
          type
        )}?${params.toString()}`;
        break;
      }

      case "by_accession": {
        if (!accession) {
          throw new Error("accession is required for features by_accession");
        }

        const params = new URLSearchParams({
          size: String(normalizeSize(size))
        });

        url = `${BASE_URL}/features/${encodeURIComponent(
          accession
        )}?${params.toString()}`;
        break;
      }

      default:
        throw new Error(`Unknown features action: ${action}`);
    }
    

    /* ----------------------------------------
       FETCH
    ---------------------------------------- */
    const res = await fetch(url, {
      headers: { Accept: "application/json" }
    });

    if (!res.ok) {
      throw new Error(`EBI Features API failed (${res.status})`);
    }

    const data: any = await res.json();

    /* ----------------------------------------
       NORMALIZATION
    ---------------------------------------- */
    const features = flattenFeatures(data).slice(0, 10);

    if (features.length === 0) {
      return {
        structuredContent: {
          action,
          accession,
          type,
          count: 0,
          features: []
        }
      };
    }

    const normalized = features.map((f: any) => ({
      type: f.type,
      category: f.category,
      description: f.description ?? null,
      begin: f.begin ?? null,
      end: f.end ?? null
    }));

    const payload = {
      action,
      accession,
      type,
      count: normalized.length,
      features: normalized
    };

    /* ----------------------------------------
       MCP RESPONSE
    ---------------------------------------- */
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(payload, null, 2) + "\n"
        }
      ],
      structuredContent: payload
    };
  }
}

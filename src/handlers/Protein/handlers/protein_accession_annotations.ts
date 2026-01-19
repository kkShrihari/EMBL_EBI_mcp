import fetch from "node-fetch";

const BASE_URL = "https://rest.uniprot.org";

/**
 * Protein accession-based annotation endpoints
 *
 * Covers:
 *
 * - /antigen
 * - /epitope
 * - /mutagenesis
 * - /rna-editing
 *
 * Each supports:
 * - search
 * - by accession
 */
export class ProteinAccessionAnnotationsHandler {
  async run(args: {
    resource: "antigen" | "epitope" | "mutagenesis" | "rna-editing";
    action: "search" | "by_accession";
    accession?: string;
    query?: string;
    size?: number;
  }) {
    const { resource, action, accession, query, size } = args;

    let url: string;

    // ----------------------------------------
    // ROUTING
    // ----------------------------------------
    if (action === "search") {
      const params = new URLSearchParams({
        ...(query ? { query } : {}),
        format: "json",
        size: String(size ?? 25)
      });

      url = `${BASE_URL}/${resource}?${params.toString()}`;
    } else if (action === "by_accession") {
      if (!accession) {
        throw new Error("accession is required for by_accession");
      }

      url = `${BASE_URL}/${resource}/${encodeURIComponent(accession)}`;
    } else {
      throw new Error(`Unsupported action: ${action}`);
    }

    // ----------------------------------------
    // FETCH
    // ----------------------------------------
    const res = await fetch(url, {
      headers: { Accept: "application/json" }
    });

    if (!res.ok) {
      throw new Error(
        `UniProt ${resource} API failed (${res.status})`
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(
        `UniProt ${resource} API returned non-JSON response: ` +
          text.slice(0, 200)
      );
    }

    const data: any = await res.json();

    // ----------------------------------------
    // EMPTY RESULT
    // ----------------------------------------
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return {
        structuredContent: {
          resource,
          action,
          accession,
          count: 0
        }
      };
    }

    // ----------------------------------------
    // PAYLOAD
    // ----------------------------------------
    const payload = {
      resource,
      action,
      accession,
      count: Array.isArray(data.results)
        ? data.results.length
        : 1,
      data
    };

    // ----------------------------------------
    // MCP RESPONSE
    // ----------------------------------------
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

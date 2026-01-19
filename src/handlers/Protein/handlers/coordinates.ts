import fetch from "node-fetch";

const BASE_URL = "https://rest.uniprot.org";

/**
 * UniProt Coordinates handler
 *
 * Covers:
 *
 * - GET /coordinates
 * - GET /coordinates/glocation/{taxonomy}/{chromosome}:{gPosition}
 * - GET /coordinates/glocation/{taxonomy}/{chromosome}:{gstart}-{gend}
 * - GET /coordinates/location/{accession}:{pPosition}
 * - GET /coordinates/location/{accession}:{pStart}-{pEnd}
 * - GET /coordinates/{accession}
 * - GET /coordinates/{dbtype}:{dbid}
 * - GET /coordinates/{taxonomy}/{locations}
 * - GET /coordinates/{taxonomy}/{locations}/feature
 */
export class ProteinCoordinatesHandler {
  async run(args: {
    action:
      | "search"
      | "glocation_single"
      | "glocation_range"
      | "location_single"
      | "location_range"
      | "by_accession"
      | "by_dbxref"
      | "by_taxonomy_locations"
      | "by_taxonomy_locations_feature";
    taxonomy?: string;
    chromosome?: string;
    gPosition?: string;
    gStart?: string;
    gEnd?: string;
    accession?: string;
    pPosition?: string;
    pStart?: string;
    pEnd?: string;
    dbtype?: string;
    dbid?: string;
    locations?: string;
    query?: string;
    size?: number;
  }) {
    const {
      action,
      taxonomy,
      chromosome,
      gPosition,
      gStart,
      gEnd,
      accession,
      pPosition,
      pStart,
      pEnd,
      dbtype,
      dbid,
      locations,
      query,
      size
    } = args;

    let url: string;

    // ----------------------------------------
    // ROUTING
    // ----------------------------------------
    switch (action) {
      case "search": {
        const params = new URLSearchParams({
          ...(query ? { query } : {}),
          format: "json",
          size: String(size ?? 25)
        });

        url = `${BASE_URL}/coordinates?${params.toString()}`;
        break;
      }

      case "glocation_single": {
        if (!taxonomy || !chromosome || !gPosition) {
          throw new Error("taxonomy, chromosome and gPosition are required");
        }

        url = `${BASE_URL}/coordinates/glocation/${encodeURIComponent(
          taxonomy
        )}/${encodeURIComponent(chromosome)}:${encodeURIComponent(
          gPosition
        )}`;
        break;
      }

      case "glocation_range": {
        if (!taxonomy || !chromosome || !gStart || !gEnd) {
          throw new Error("taxonomy, chromosome, gStart and gEnd are required");
        }

        url = `${BASE_URL}/coordinates/glocation/${encodeURIComponent(
          taxonomy
        )}/${encodeURIComponent(chromosome)}:${encodeURIComponent(
          gStart
        )}-${encodeURIComponent(gEnd)}`;
        break;
      }

      case "location_single": {
        if (!accession || !pPosition) {
          throw new Error("accession and pPosition are required");
        }

        url = `${BASE_URL}/coordinates/location/${encodeURIComponent(
          accession
        )}:${encodeURIComponent(pPosition)}`;
        break;
      }

      case "location_range": {
        if (!accession || !pStart || !pEnd) {
          throw new Error("accession, pStart and pEnd are required");
        }

        url = `${BASE_URL}/coordinates/location/${encodeURIComponent(
          accession
        )}:${encodeURIComponent(pStart)}-${encodeURIComponent(pEnd)}`;
        break;
      }

      case "by_accession": {
        if (!accession) {
          throw new Error("accession is required");
        }

        url = `${BASE_URL}/coordinates/${encodeURIComponent(accession)}`;
        break;
      }

      case "by_dbxref": {
        if (!dbtype || !dbid) {
          throw new Error("dbtype and dbid are required");
        }

        url = `${BASE_URL}/coordinates/${encodeURIComponent(
          dbtype
        )}:${encodeURIComponent(dbid)}`;
        break;
      }

      case "by_taxonomy_locations": {
        if (!taxonomy || !locations) {
          throw new Error("taxonomy and locations are required");
        }

        url = `${BASE_URL}/coordinates/${encodeURIComponent(
          taxonomy
        )}/${encodeURIComponent(locations)}`;
        break;
      }

      case "by_taxonomy_locations_feature": {
        if (!taxonomy || !locations) {
          throw new Error("taxonomy and locations are required");
        }

        url = `${BASE_URL}/coordinates/${encodeURIComponent(
          taxonomy
        )}/${encodeURIComponent(locations)}/feature`;
        break;
      }

      default:
        throw new Error(`Unknown coordinates action: ${action}`);
    }

    // ----------------------------------------
    // FETCH
    // ----------------------------------------
    const res = await fetch(url, {
      headers: { Accept: "application/json" }
    });

    if (!res.ok) {
      throw new Error(`UniProt Coordinates API failed (${res.status})`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(
        "UniProt Coordinates API returned non-JSON response: " +
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
          action,
          accession,
          taxonomy,
          count: 0
        }
      };
    }

    // ----------------------------------------
    // PAYLOAD
    // ----------------------------------------
    const payload = {
      action,
      accession,
      taxonomy,
      chromosome,
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

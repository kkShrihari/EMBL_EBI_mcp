import fetch from "node-fetch";
import { TextDecoder } from "util";

const BASE_URL = "https://www.ebi.ac.uk/proteins/api";

const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 10;
const MAX_NESTED = 3;

/* ---------------------------------
   HELPERS
---------------------------------- */

function normalizeSize(size?: number): number {
  if (!size) return DEFAULT_LIMIT;
  return Math.min(Math.max(size, 1), MAX_LIMIT);
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "identity" // prevent gzip corruption
    },
    compress: false
  });

  if (!res.ok) {
    const buf = await res.arrayBuffer();
    const txt = new TextDecoder("utf-8").decode(buf);
    throw new Error(`EBI API failed (${res.status}): ${txt.slice(0, 200)}`);
  }

  const buffer = await res.arrayBuffer();
  const text = new TextDecoder("utf-8").decode(buffer);

  return JSON.parse(text);
}

/* ---------------------------------
   NORMALIZATION
---------------------------------- */

function normalizeCoordinateResponse(
  raw: any,
  action: string
): any[] {
  if (!raw) return [];

  // glocation / location endpoints
  if (Array.isArray(raw)) {
    return raw.flatMap((r: any) =>
      Array.isArray(r.locations) ? r.locations : []
    );
  }

  // by_accession
  if (action === "by_accession" && Array.isArray(raw.gnCoordinate)) {
    return raw.gnCoordinate.map((gc: any) => ({
      accession: raw.accession,
      taxid: raw.taxid,
      chromosome: gc.genomicLocation.chromosome,
      start: gc.genomicLocation.start,
      end: gc.genomicLocation.end,
      reverseStrand: gc.genomicLocation.reverseStrand,
      assemblyName: gc.genomicLocation.assemblyName,
      features: gc.feature
    }));
  }

  return [];
}

/* ---------------------------------
   ESSENTIAL TRIMMERS
---------------------------------- */

function limit<T>(arr?: T[]): T[] | undefined {
  return Array.isArray(arr) ? arr.slice(0, MAX_NESTED) : undefined;
}

function extractFeature(f: any): any {
  return {
    type: f.type,
    description: f.description,
    original: f.original,
    variation: limit(f.variation),
    genomeLocation: f.genomeLocation
      ? {
          begin: f.genomeLocation.begin?.position,
          end: f.genomeLocation.end?.position
        }
      : undefined
  };
}

function extractLocation(l: any): any {
  return {
    accession: l.accession,
    taxid: l.taxid,
    chromosome: l.chromosome,
    geneStart: l.start ?? l.geneStart,
    geneEnd: l.end ?? l.geneEnd,
    strand: l.reverseStrand ? "-" : "+",
    assembly: l.assemblyName,
    features: limit(l.features)?.map(extractFeature)
  };
}

/* ---------------------------------
   HANDLER
---------------------------------- */

interface CoordinatesArgs {
  action: string;
  size?: number;
  query?: string;
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
}

export class ProteinCoordinatesHandler {
  async run(args: CoordinatesArgs): Promise<any> {
    const size = normalizeSize(args.size);
    let raw: any;

    switch (args.action) {
      case "search": {
        const params = new URLSearchParams({
          gene: args.query ?? "",
          taxid: args.taxonomy ?? "",
          size: String(size)
        });

        raw = await fetchJson(`${BASE_URL}/coordinates?${params}`);

        return {
          structuredContent: {
            action: args.action,
            count: raw?.proteins?.length ?? 0,
            data: raw?.proteins?.slice(0, size) ?? []
          }
        };
      }

      case "glocation_single":
        raw = await fetchJson(
          `${BASE_URL}/coordinates/glocation/${args.taxonomy}/${args.chromosome}:${args.gPosition}`
        );
        break;

      case "glocation_range":
        raw = await fetchJson(
          `${BASE_URL}/coordinates/glocation/${args.taxonomy}/${args.chromosome}:${args.gStart}-${args.gEnd}`
        );
        break;

      case "location_single":
        raw = await fetchJson(
          `${BASE_URL}/coordinates/location/${args.accession}:${args.pPosition}`
        );
        break;

      case "location_range":
        raw = await fetchJson(
          `${BASE_URL}/coordinates/location/${args.accession}:${args.pStart}-${args.pEnd}`
        );
        break;

      case "by_accession":
        raw = await fetchJson(
          `${BASE_URL}/coordinates/${args.accession}`
        );
        break;

      case "by_dbxref":
        raw = await fetchJson(
          `${BASE_URL}/coordinates/${args.dbtype}:${args.dbid}`
        );
        break;

      case "by_taxonomy_locations":
        raw = await fetchJson(
          `${BASE_URL}/coordinates/${args.taxonomy}/${args.locations}`
        );
        break;

      case "by_taxonomy_locations_feature":
        raw = await fetchJson(
          `${BASE_URL}/coordinates/${args.taxonomy}/${args.locations}/featureSearch`
        );
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    const data = normalizeCoordinateResponse(raw, args.action)
      .slice(0, MAX_LIMIT)
      .slice(0, size)
      .map(extractLocation);

    return {
      structuredContent: {
        action: args.action,
        count: data.length,
        data
      }
    };
  }
}

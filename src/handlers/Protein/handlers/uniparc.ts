import fetch, { HeadersInit, RequestInit } from "node-fetch";

/**
 * UniParc API base
 */
const BASE_URL = "https://rest.uniprot.org";

/* ---------------------------------
   HELPERS
---------------------------------- */

/** normalize size: default 3, max 10 */
function normalizeSize(size?: number) {
  if (!size) return 3;
  return Math.min(Math.max(size, 3), 10);
}

/** safe JSON fetch */
async function fetchJson(
  url: string,
  options?: RequestInit
): Promise<any> {
  const headers: HeadersInit = {
    Accept: "application/json"
  };

  if (options?.headers) {
    Object.assign(headers as any, options.headers);
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `UniParc API failed (${res.status}): ${text.slice(0, 200)}`
    );
  }

  return res.json();
}

/** keep only important UniParc fields (max 10) */
function trimUniParcEntry(entry: any) {
  if (!entry || typeof entry !== "object") return entry;

  const keys = [
    "upi",
    "sequenceLength",
    "crc64",
    "md5",
    "taxonId",
    "organism",
    "proteinName",
    "uniProtKBAccessions",
    "proteomes",
    "sequence"
  ];

  return Object.fromEntries(
    Object.entries(entry).filter(([k]) => keys.includes(k))
  );
}

/** trim result list */
function trimResults(results: any[], limit: number) {
  return (results ?? []).slice(0, limit).map(trimUniParcEntry);
}

/* ---------------------------------
   HANDLER
---------------------------------- */

export class ProteinUniParcHandler {
  async run(args: {
    action:
      | "search"
      | "by_accession"
      | "bestguess"
      | "by_dbreference"
      | "by_proteome"
      | "by_sequence"
      | "by_upi";
    accession?: string;
    dbid?: string;
    upid?: string;
    upi?: string;
    sequence?: string;
    query?: string;
    size?: number;
  }) {
    const size = normalizeSize(args.size);
    let data: any;

    /* ---------- SEARCH ---------- */
    if (args.action === "search") {
      const params = new URLSearchParams({
        ...(args.query ? { query: args.query } : {}),
        format: "json",
        size: String(size)
      });

      const raw = await fetchJson(
        `${BASE_URL}/uniparc?${params.toString()}`
      );

      data = {
        total: raw.total,
        results: trimResults(raw.results, size)
      };
    }

    /* ---------- BY ACCESSION ---------- */
    else if (args.action === "by_accession") {
      if (!args.accession) throw new Error("accession required");

      const raw = await fetchJson(
        `${BASE_URL}/uniparc/accession/${encodeURIComponent(
          args.accession
        )}?format=json`
      );

      data = trimUniParcEntry(raw);
    }

    /* ---------- BEST GUESS ---------- */
    else if (args.action === "bestguess") {
      if (!args.query) throw new Error("query required");

      const params = new URLSearchParams({
        query: args.query,
        format: "json"
      });

      const raw = await fetchJson(
        `${BASE_URL}/uniparc/bestguess?${params.toString()}`
      );

      data = trimResults(raw.results, size);
    }

    /* ---------- DB REFERENCE ---------- */
    else if (args.action === "by_dbreference") {
      if (!args.dbid) throw new Error("dbid required");

      const raw = await fetchJson(
        `${BASE_URL}/uniparc/dbreference/${encodeURIComponent(
          args.dbid
        )}?format=json`
      );

      data = trimResults(raw.results, size);
    }

    /* ---------- PROTEOME ---------- */
    else if (args.action === "by_proteome") {
      if (!args.upid) throw new Error("upid required");

      const raw = await fetchJson(
        `${BASE_URL}/uniparc/proteome/${encodeURIComponent(
          args.upid
        )}?format=json`
      );

      data = trimResults(raw.results, size);
    }

    /* ---------- BY SEQUENCE (POST) ---------- */
    else if (args.action === "by_sequence") {
      if (!args.sequence) throw new Error("sequence required");

      const raw = await fetchJson(
        `${BASE_URL}/uniparc/sequence`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sequence: args.sequence })
        }
      );

      data = trimResults(raw.results, size);
    }

    /* ---------- BY UPI ---------- */
    else if (args.action === "by_upi") {
      if (!args.upi) throw new Error("upi required");

      const raw = await fetchJson(
        `${BASE_URL}/uniparc/upi/${encodeURIComponent(
          args.upi
        )}?format=json`
      );

      data = trimUniParcEntry(raw);
    }

    else {
      throw new Error(`Unknown action: ${args.action}`);
    }

    /* ---------- RESPONSE ---------- */
    return {
      structuredContent: {
        action: args.action,
        count: Array.isArray(data)
          ? data.length
          : Array.isArray(data?.results)
          ? data.results.length
          : 1,
        data
      },
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { action: args.action, data },
            null,
            2
          )
        }
      ]
    };
  }
}

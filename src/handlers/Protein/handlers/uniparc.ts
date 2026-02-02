import fetch from "node-fetch";

const BASE_URL = "https://rest.uniprot.org";

/* ---------------------------------
   TYPES
---------------------------------- */

type UniParcAction =
  | "by_accession"
  | "bestguess"
  | "by_dbreference"
  | "by_proteome"
  | "by_sequence"
  | "by_upi";

interface UniParcArgs {
  action: UniParcAction;
  accession?: string;
  dbid?: string;
  upid?: string;
  upi?: string;
  sequence?: string;
  query?: string;
  size?: number;
}

/* ---------------------------------
   HELPERS
---------------------------------- */

function normalizeSize(size?: number): number {
  if (!size) return 3;
  return Math.min(Math.max(size, 1), 10);
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `UniParc API failed (${res.status}): ${text.slice(0, 200)}`
    );
  }

  return res.json();
}

function trimUniParcEntry(entry: any): any {
  if (!entry || typeof entry !== "object") return entry;

  const keys = [
    "upi",
    "sequence",
    "sequenceLength",
    "crc64",
    "md5",
    "taxonId",
    "organism",
    "uniProtKBAccessions"
  ];

  return Object.fromEntries(
    Object.entries(entry).filter(([k]) => keys.includes(k))
  );
}

function trimResults(results: any[], limit: number): any[] {
  return (results ?? []).slice(0, limit).map(trimUniParcEntry);
}

/* ---------------------------------
   HANDLER
---------------------------------- */

export class ProteinUniParcHandler {
  async run(args: UniParcArgs): Promise<any> {
    const size = normalizeSize(args.size);
    let data: any;

    /* ---------- BY ACCESSION ---------- */
    if (args.action === "by_accession") {
      const raw = await fetchJson(
        `${BASE_URL}/uniparc/accession/${args.accession}`
      );
      data = trimUniParcEntry(raw);
    }

    /* ---------- BEST GUESS ---------- */
    else if (args.action === "bestguess") {
      const params = new URLSearchParams();

      if (args.query?.startsWith("UPI")) {
        params.set("upis", args.query);
      } else if (/^[A-NR-Z][0-9][A-Z0-9]{3}[0-9]$/.test(args.query ?? "")) {
        params.set("accessions", args.query!);
      } else {
        params.set("genes", args.query!);
      }

      const raw = (await fetchJson(
        `${BASE_URL}/uniparc/bestguess?${params}`
      )) as { results?: any[] } | null;

      data = raw?.results ? trimResults(raw.results, size) : [];
    }

    /* ---------- DB REFERENCE ---------- */
    else if (args.action === "by_dbreference") {
      const raw = (await fetchJson(
        `${BASE_URL}/uniparc/dbreference/${args.dbid}`
      )) as { results?: any[] };

      data = trimResults(raw.results ?? [], size);
    }

    /* ---------- BY UPI ---------- */
    else if (args.action === "by_upi") {
      const raw = await fetchJson(
        `${BASE_URL}/uniparc/${args.upi}`
      );
      data = trimUniParcEntry(raw);
    }

    /* ---------- PROTEOME (GRACEFUL) ---------- */
    else if (args.action === "by_proteome") {
      data = {
        notice: "UniParc does not support proteome-level queries.",
        recommendation: "Use UniProtKB proteome endpoints instead.",
        requestedProteome: args.upid,
        returnedEntries: 0
      };
    }

    /* ---------- SEQUENCE (GRACEFUL) ---------- */
    else if (args.action === "by_sequence") {
      data = {
        notice: "UniParc does not support sequence-based search.",
        recommendation: "Use UniProtKB search or BLAST services.",
        sequenceLength: args.sequence?.length ?? 0,
        returnedEntries: 0
      };
    }

    else {
      throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      structuredContent: {
        action: args.action,
        count: Array.isArray(data) ? data.length : 1,
        data
      }
    };
  }
}

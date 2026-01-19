import fetch from "node-fetch";

/**
 * EBI Proteins API
 */
const BASE_URL = "https://www.ebi.ac.uk/proteins/api";

/* ---------------------------------
   FETCH HELPER
---------------------------------- */
async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" }
  });

  if (!res.ok) {
    throw new Error(`UniProt Proteomics API failed (${res.status})`);
  }

  return res.json();
}

/* ---------------------------------
   SIZE NORMALIZATION
---------------------------------- */
function normalizeSize(size?: number) {
  if (!size) return 3;
  return Math.min(Math.max(size, 3), 10);
}

/* ---------------------------------
   GENERIC PROTEOMICS TRIMMER
---------------------------------- */
function trimProteomicsFeatures(
  features: any[],
  featureLimit: number,
  evidenceLimit: number
) {
  return (features ?? [])
    .slice(0, featureLimit)
    .map((f: any) => ({
      type: f.type,
      begin: f.begin,
      end: f.end,
      peptide: f.peptide,
      unique: f.unique,
      evidences: (f.evidences ?? [])
        .slice(0, evidenceLimit)
        .map((e: any) => ({
          code: e.code,
          source: {
            name: e.source?.name,
            id: e.source?.id,
            url: e.source?.url,
            properties: e.source?.properties
              ? Object.fromEntries(
                  Object.entries(e.source.properties).slice(0, 10)
                )
              : undefined
          }
        }))
    }));
}

/* ---------------------------------
   HANDLER
---------------------------------- */
export class ProteinProteomicsHandler {
  async run(args: {
    action:
      | "species"
      | "species_search"
      | "non_ptm_search"
      | "non_ptm_by_accession"
      | "ptm_search"
      | "ptm_by_accession"
      | "hpp_search"
      | "hpp_by_accession";
    query?: string;
    accession?: string;
    size?: number;
  }) {
    const size = normalizeSize(args.size);
    let data: any;

    /* ---------- SPECIES ---------- */
    if (args.action === "species") {
      data = await fetchJson(`${BASE_URL}/proteomics/species`);
    }

    else if (args.action === "species_search") {
      if (!args.query) throw new Error("query required");

      const all = await fetchJson(`${BASE_URL}/proteomics/species`);
      const [key, value] = args.query.split(":");

      data = all.filter((s: any) =>
        key === "taxId"
          ? String(s.taxId) === value
          : key === "upId"
          ? s.upId === value
          : false
      );
    }

    /* ---------- NON-PTM ---------- */
    else if (args.action === "non_ptm_search") {
      throw new Error(
        "non_ptm_search is not supported. Use non_ptm_by_accession instead."
      );
    }

    else if (args.action === "non_ptm_by_accession") {
      if (!args.accession) throw new Error("accession required");

      const raw = await fetchJson(
        `${BASE_URL}/proteomics/nonPtm/${encodeURIComponent(
          args.accession
        )}`
      );

      data = {
        accession: raw.accession,
        entryName: raw.entryName,
        taxid: raw.taxid,
        features: trimProteomicsFeatures(raw.features, 3, 3)
      };
    }

    /* ---------- PTM ---------- */
    else if (args.action === "ptm_search") {
      throw new Error(
        "ptm_search is not supported. Use ptm_by_accession instead."
      );
    }

    else if (args.action === "ptm_by_accession") {
      if (!args.accession) throw new Error("accession required");

      const raw = await fetchJson(
        `${BASE_URL}/proteomics/ptm/${encodeURIComponent(
          args.accession
        )}`
      );

      data = {
        accession: raw.accession,
        entryName: raw.entryName,
        taxid: raw.taxid,
        features: trimProteomicsFeatures(raw.features, 3, 3)
      };
    }

    /* ---------- ✅ HPP (UPDATED) ---------- */
    else if (args.action === "hpp_search") {
      throw new Error(
        "hpp_search is not supported. Use hpp_by_accession instead."
      );
    }

    else if (args.action === "hpp_by_accession") {
      if (!args.accession) throw new Error("accession required");

      const raw = await fetchJson(
        `${BASE_URL}/proteomics/hpp/${encodeURIComponent(
          args.accession
        )}`
      );

      data = {
        accession: raw.accession,
        entryName: raw.entryName,
        taxid: raw.taxid,
        features: trimProteomicsFeatures(
          raw.features,
          size,   // ✅ default 3, max 10 features
          10      // ✅ max 10 evidences per feature
        )
      };
    }

    else {
      throw new Error("Unknown proteomics action");
    }

    /* ---------- RESPONSE ---------- */
    return {
      structuredContent: {
        action: args.action,
        accession: args.accession,
        count: Array.isArray(data?.features)
          ? data.features.length
          : Array.isArray(data)
          ? data.length
          : 1,
        data
      },
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              action: args.action,
              data
            },
            null,
            2
          )
        }
      ]
    };
  }
}

import fetch from "node-fetch";

const BASE_URL = "https://rest.uniprot.org";

/* ---------------------------------
   FETCH HELPER
---------------------------------- */
async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" }
  });

  if (!res.ok) {
    throw new Error(`UniProt API failed (${res.status})`);
  }

  return res.json();
}

/* ---------------------------------
   SIZE CONTROL (default = 3)
---------------------------------- */
function normalizeSize(size?: number) {
  if (!size) return 3;
  return Math.min(Math.max(size, 3), 10);
}

/* ---------------------------------
   PROJECTIONS / SUMMARIZERS
---------------------------------- */

// Proteome search result
function summarizeProteomeSearch(p: any) {
  return {
    id: p.id,
    proteomeType: p.proteomeType,
    organism: p.organism?.scientificName,
    taxonId: p.organism?.taxonId,
    organismMnemonic: p.organism?.mnemonic,
    proteinCount: p.proteinCount,
    geneCount: p.geneCount,
    assemblyId: p.genomeAssembly?.assemblyId,
    assemblyLevel: p.genomeAssembly?.level,
    annotationSource: p.genomeAnnotation?.source
  };
}


// Single proteome (by UPID)
function summarizeProteome(p: any, max: number) {
  return {
    id: p.id,
    proteomeType: p.proteomeType,
    proteinCount: p.proteinCount,
    components: (p.components ?? []).slice(0, max).map((c: any) => ({
      name: c.name,
      proteinCount: c.proteinCount
    })),
    citations: (p.citations ?? []).slice(0, max).map((c: any) => ({
      id: c.id,
      title: c.title,
      journal: c.journal,
      year: c.publicationDate,
      authors: (c.authors ?? []).slice(0, 3)
    }))
  };
}

// UniProtKB protein
function summarizeProtein(e: any) {
  return {
    accession: e.primaryAccession,
    uniProtkbId: e.uniProtkbId,
    proteinName:
      e.proteinDescription?.recommendedName?.fullName?.value ??
      e.proteinDescription?.submissionNames?.[0]?.fullName?.value,
    gene: e.genes?.[0]?.geneName?.value,
    organism: e.organism?.scientificName,
    taxonId: e.organism?.taxonId,
    reviewed: e.entryType === "UniProtKB reviewed (Swiss-Prot)",
    proteinExistence: e.proteinExistence,
    length: e.sequence?.length,
    sequenceVersion: e.sequence?.version
  };
}


// GeneCentric record
function summarizeGeneCentric(e: any) {
  return {
    proteomeId: e.proteomeId,
    canonicalAccession: e.canonicalProtein?.id,
    proteinName: e.canonicalProtein?.proteinName,
    gene: e.canonicalProtein?.geneName,
    organism: e.canonicalProtein?.organism?.scientificName,
    taxonId: e.canonicalProtein?.organism?.taxonId,
    length: e.canonicalProtein?.sequence?.length,
    entryType: e.canonicalProtein?.entryType,
    proteinExistence: e.canonicalProtein?.proteinExistence,
    relatedProteinCount: Array.isArray(e.relatedProteins)
      ? e.relatedProteins.length
      : 0
  };
}


/* ---------------------------------
   HANDLER
---------------------------------- */
export class ProteinProteomesHandler {
  async run(args: {
    action:
      | "proteomes_search"
      | "proteome_by_upid"
      | "proteins_by_proteome"
      | "proteins_by_gene"
      | "genecentric_search"
      | "genecentric_by_accession";
    query?: string;
    upid?: string;
    accession?: string;
    size?: number;
  }) {
    const size = normalizeSize(args.size);
    let url: string;

    switch (args.action) {
      case "proteomes_search":
        if (!args.query) throw new Error("query required");
        url = `${BASE_URL}/proteomes/search?query=${encodeURIComponent(
          args.query
        )}&size=${size}`;
        break;

      case "proteome_by_upid":
        if (!args.upid) throw new Error("upid required");
        url = `${BASE_URL}/proteomes/${args.upid}`;
        break;

      case "proteins_by_proteome":
        if (!args.upid) throw new Error("upid required");
        url = `${BASE_URL}/uniprotkb/search?query=proteome:${args.upid}&size=${size}`;
        break;

      case "proteins_by_gene":
        if (!args.query) throw new Error("gene name required");
        url = `${BASE_URL}/uniprotkb/search?query=gene:${encodeURIComponent(
          args.query
        )}&size=${size}`;
        break;

      case "genecentric_search":
        if (!args.query) throw new Error("gene name required");
        url = `${BASE_URL}/genecentric/search?query=${encodeURIComponent(
          args.query
        )}&size=${size}`;
        break;

      case "genecentric_by_accession":
        if (!args.accession) throw new Error("accession required");
        url = `${BASE_URL}/genecentric/${args.accession}`;
        break;

      default:
        throw new Error("Unknown action");
    }

    const data: any = await fetchJson(url);

    let result: any;

    if (args.action === "proteome_by_upid") {
      result = summarizeProteome(data, size);
    }
    else if (args.action === "proteomes_search") {
      result = (data.results ?? []).map(summarizeProteomeSearch);
    }
    else if (args.action.startsWith("genecentric")) {
      result = Array.isArray(data.results)
        ? data.results.map(summarizeGeneCentric)
        : summarizeGeneCentric(data);
    }
    else {
      result = (data.results ?? []).map(summarizeProtein);
    }

    return {
      structuredContent: {
        action: args.action,
        count: Array.isArray(result) ? result.length : 1,
        data: result
      },
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              action: args.action,
              count: Array.isArray(result) ? result.length : 1,
              data: result
            },
            null,
            2
          )
        }
      ]
    };
  }
}

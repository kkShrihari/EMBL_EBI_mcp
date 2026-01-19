import fetch from "node-fetch";

const BASE_URL = "https://rest.uniprot.org/uniprotkb";

/* -------------------------------
   HELPERS
--------------------------------*/

function summarizeGO(crossRefs: any[] = []) {
  return crossRefs
    .filter(ref => ref.database === "GO")
    .map(ref => {
      const term = ref.properties?.find(
        (p: any) => p.key === "GoTerm"
      )?.value;

      return {
        goId: ref.id,
        term,
        category: term?.split(":")[0]
      };
    })
    .slice(0, 5);
}

function summarizeProtein(entry: any) {
  return {
    accession: entry.primaryAccession,
    proteinName:
      entry.proteinDescription?.recommendedName?.fullName?.value ??
      "Unknown",
    gene:
      entry.genes?.[0]?.geneName?.value ?? "Unknown",
    organism:
      entry.organism?.scientificName ?? "Unknown",
    length: entry.sequence?.length ?? null,
    goTerms: summarizeGO(entry.uniProtKBCrossReferences),
    uniprotUrl: `https://www.uniprot.org/uniprotkb/${entry.primaryAccession}`
  };
}

function extractIsoforms(entry: any, limit = 5) {
  const alt = entry.comments?.find(
    (c: any) => c.commentType === "ALTERNATIVE PRODUCTS"
  );

  const isoforms = alt?.isoforms ?? [];

  return isoforms.slice(0, limit).map((iso: any) => ({
    isoformId: iso.isoformIds?.[0] ?? "Unknown",
    name: iso.name?.value ?? "Unknown",
    sequenceStatus: iso.sequenceStatus ?? "Not specified",
    note: iso.note?.texts?.[0]?.value ?? "Not specified"
  }));
}



const XREF_FIELD_MAP: Record<string, string> = {
  GeneID: "xref_geneid",
};

/* -------------------------------
   HANDLER
--------------------------------*/

export class ProteinIdentityHandler {
  async run(args: {
    action:
      | "search"
      | "by_accession"
      | "isoforms"
      | "interactions"
      | "by_xref";
    query?: string;
    accession?: string;
    dbtype?: string;
    dbid?: string;
    size?: number;
  }) {
    const { action, query, accession, dbtype, dbid, size } = args;

    let url: string;

    /* -------------------------------
       ROUTING
    --------------------------------*/

    switch (action) {
      case "search": {
        if (!query) throw new Error("query is required");

        const params = new URLSearchParams({
          query,
          format: "json",
          size: String(Math.min(size ?? 3, 10))
        });

        url = `${BASE_URL}/search?${params.toString()}`;
        break;
      }

      case "by_accession": {
        if (!accession) throw new Error("accession is required");
        url = `${BASE_URL}/${encodeURIComponent(accession)}?format=json`;
        break;
      }

      case "isoforms": {
        if (!accession) throw new Error("accession is required");
        url = `${BASE_URL}/${encodeURIComponent(accession)}?format=json`;
        break;
      }

      case "interactions": {
        if (!accession) throw new Error("accession is required");

        const params = new URLSearchParams({
          query: `interactor:${accession}`,
          format: "json",
          size: String(Math.min(size ?? 3, 10))
        });

        url = `${BASE_URL}/search?${params.toString()}`;
        break;
      }

      case "by_xref": {
        if (!dbtype || !dbid) {
          throw new Error("dbtype and dbid are required for by_xref");
        }

        const field = XREF_FIELD_MAP[dbtype];
        if (!field) {
          throw new Error(`Unsupported cross-reference type: ${dbtype}`);
        }

        const params = new URLSearchParams({
          query: `(${field}-${dbid})`,
          format: "json",
          size: String(Math.min(size ?? 3, 10))
        });

        url = `${BASE_URL}/search?${params.toString()}`;
        break;
      }


      default:
        throw new Error(`Unknown action: ${action}`);
    }

    /* -------------------------------
       FETCH
    --------------------------------*/

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`UniProt API failed (${res.status})`);
    }

    const data: any = await res.json();

    /* -------------------------------
       NORMALIZATION
    --------------------------------*/

    let summarizedResults: any[];

    if (action === "isoforms") {
      summarizedResults = [
        {
          accession: data.primaryAccession,
          gene: data.genes?.[0]?.geneName?.value ?? "Unknown",
          isoforms: extractIsoforms(data, size ?? 5)
        }
      ];
    } else {
      const rawResults = Array.isArray(data.results)
        ? data.results
        : [data];

      summarizedResults = rawResults
        .map(summarizeProtein)
        .slice(0, 10);
    }

    /* -------------------------------
       RESPONSE
    --------------------------------*/

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              action,
              count: summarizedResults.length,
              data: summarizedResults
            },
            null,
            2
          )
        }
      ],
      structuredContent: {
        action,
        count: summarizedResults.length,
        data: summarizedResults
      }
    };
  }
}

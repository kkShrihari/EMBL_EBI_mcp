import fetch from "node-fetch";

const PROTEINS_API = "https://www.ebi.ac.uk/proteins/api";
const UNIPROT_REST = "https://rest.uniprot.org";

/* ----------------------------------------
   SUPPORTED RESOURCES
---------------------------------------- */

type Resource = "antigen" | "epitope" | "mutagenesis";

/* ----------------------------------------
   BASIC TYPES
---------------------------------------- */

type Feature = {
  evidences?: unknown[];
  [key: string]: unknown;
};

type ProteinEntry = {
  accession?: string;
  entryName?: string;
  taxid?: number;
  features?: Feature[];
};

/* ----------------------------------------
   UTILS
---------------------------------------- */

function looksLikeAccession(v: string): boolean {
  return /^[A-NR-Z][0-9][A-Z0-9]{3}[0-9]$/.test(v);
}

function limitEvidences(feature: Feature, max = 3): Feature {
  if (Array.isArray(feature.evidences)) {
    return { ...feature, evidences: feature.evidences.slice(0, max) };
  }
  return feature;
}

/* ----------------------------------------
   GENE → ACCESSION (HUMAN, REVIEWED)
---------------------------------------- */

async function resolveGeneToAccession(gene: string): Promise<string> {
  const url =
    `${UNIPROT_REST}/uniprotkb/search?` +
    new URLSearchParams({
      query: `gene:${gene} AND organism_id:9606 AND reviewed:true`,
      fields: "accession",
      size: "1"
    });

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Failed to resolve gene ${gene}`);

  const json = (await res.json()) as {
    results?: { primaryAccession?: string }[];
  };

  const acc = json.results?.[0]?.primaryAccession;
  if (!acc) {
    throw new Error(
      `No reviewed human UniProt accession found for gene ${gene}`
    );
  }

  return acc;
}

/* ----------------------------------------
   HANDLER
---------------------------------------- */

export class ProteinAccessionAnnotationsHandler {
  async run(args: {
    resource: Resource;
    action: "search" | "by_accession";
    accession?: string;
    query?: string;
    maxFeatures?: number;
    maxEvidences?: number;
  }) {
    const {
      resource,
      action,
      accession,
      query,
      maxFeatures = 25,
      maxEvidences = 3
    } = args;

    let finalAccession = accession;

    if (action === "search") {
      if (!query) throw new Error("query is required for search");

      finalAccession = looksLikeAccession(query)
        ? query
        : await resolveGeneToAccession(query);
    }

    if (!finalAccession) {
      throw new Error("Could not resolve accession");
    }

    const url = `${PROTEINS_API}/${resource}/${finalAccession}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Proteins API ${resource} failed (${res.status}): ${text.slice(0, 200)}`
      );
    }

    const data = (await res.json()) as ProteinEntry;

    const allFeatures = Array.isArray(data.features) ? data.features : [];
    const features = allFeatures
      .slice(0, maxFeatures)
      .map(f => limitEvidences(f, maxEvidences));

    return {
      structuredContent: {
        resource,
        action,
        accession: finalAccession,
        featureCount: allFeatures.length,
        returnedFeatures: features.length,
        data: {
          accession: data.accession,
          entryName: data.entryName,
          taxid: data.taxid,
          features
        }
      }
    };
  }
}

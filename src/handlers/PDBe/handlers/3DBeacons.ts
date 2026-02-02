import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/pdbe/api";

/* ---------------------------------
   FETCH HELPER
---------------------------------- */
async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" }
  });

  // PDBe semantics: empty is valid
  if (res.status === 404 || res.status === 422) {
    return {};
  }

  if (!res.ok) {
    throw new Error(`PDBe API failed (${res.status})`);
  }

  return res.json();
}

/* ---------------------------------
   SIZE CONTROL
---------------------------------- */
function normalizeSize(size?: number) {
  if (!size) return 3;
  return Math.min(Math.max(size, 1), 10);
}

function limitSub<T>(arr?: T[], max = 5): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, max);
}

/* ---------------------------------
   SUMMARIZERS
---------------------------------- */

// /beacons/uniprot/summary/{uniprot}.json
function summarizeStructureSummary(entry: any) {
  const s = entry.summary;
  return {
    modelId: s.model_identifier,
    category: s.model_category,
    provider: s.provider,
    method: s.experimental_method,
    resolution: s.resolution,
    coverage: s.coverage,
    uniprotRange: `${s.uniprot_start}-${s.uniprot_end}`,
    entities: limitSub(
      s.entities?.map((e: any) => ({
        type: e.entity_type,
        identifier: e.identifier,
        description: e.description,
        chains: limitSub(e.chain_ids)
      }))
    )
  };
}

// /beacons/uniprot/{uniprot}.json
function summarizePdbChain(entry: any) {
  const s = entry.summary;
  return {
    modelId: s.model_identifier,
    provider: s.provider,
    method: s.experimental_method,
    resolution: s.resolution,
    coverage: s.coverage,
    chains: limitSub(
      entry.chains?.map((c: any) => ({
        chainId: c.chain_id,
        segments: limitSub(
          c.segments?.map((seg: any) => ({
            uniprotRange: `${seg.uniprot?.from}-${seg.uniprot?.to}`,
            templates: limitSub(
              seg.templates?.map((t: any) => ({
                templateId: t.template_id,
                chainId: t.chain_id,
                identity: t.template_sequence_identity,
                method: t.experimental_method,
                resolution: t.resolution
              }))
            )
          }))
        )
      }))
    )
  };
}

// /beacons/annotations/{uniprot}.json
function summarizeAnnotation(entry: any) {
  return {
    type: entry.type,
    description: entry.description,
    source: entry.source_name,
    evidence: entry.evidence,
    regions: limitSub(
      entry.regions?.map((r: any) => ({
        start: r.start,
        end: r.end
      }))
    )
  };
}

/* ---------------------------------
   HANDLER
---------------------------------- */
export class PDBeBeaconsHandler {
  async run(args: {
    action:
      | "uniprot_structure_summary"
      | "uniprot_pdb_chains"
      | "uniprot_annotations";
    uniprot_id: string;
    size?: number;
    type?: string; // for annotations
  }) {
    const size = normalizeSize(args.size);
    let url: string;

    switch (args.action) {
      case "uniprot_structure_summary":
        url = `${BASE_URL}/beacons/uniprot/summary/${args.uniprot_id}.json`;
        break;

      case "uniprot_pdb_chains":
        url = `${BASE_URL}/beacons/uniprot/${args.uniprot_id}.json`;
        break;

      case "uniprot_annotations": {
        const type = args.type ?? "DOMAIN";
        url = `${BASE_URL}/beacons/annotations/${args.uniprot_id}.json?type=${type}`;
        break;
      }

      default:
        throw new Error("Unknown action");
    }

    const data: any = await fetchJson(url);

    // ✅ Correct response shape per spec
    const records =
      args.action === "uniprot_annotations"
        ? data?.annotation ?? []
        : data?.structures ?? [];

    let result: any[] = [];

    switch (args.action) {
      case "uniprot_structure_summary":
        result = records.slice(0, size).map(summarizeStructureSummary);
        break;

      case "uniprot_pdb_chains":
        result = records.slice(0, size).map(summarizePdbChain);
        break;

      case "uniprot_annotations":
        result = records.slice(0, size).map(summarizeAnnotation);
        break;
    }

    return {
      structuredContent: {
        action: args.action,
        uniprot_id: args.uniprot_id,
        count: result.length,
        data: result
      },
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              action: args.action,
              uniprot_id: args.uniprot_id,
              count: result.length,
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

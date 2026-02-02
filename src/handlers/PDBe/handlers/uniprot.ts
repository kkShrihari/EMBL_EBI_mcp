// import fetch from "node-fetch";

// const BASE_URL = "https://www.ebi.ac.uk/pdbe/api";

// /* ---------------------------------
//    LIMITS
// ---------------------------------- */
// const DEFAULT_LIMIT = 3;
// const MAX_LIMIT = 10;

// /* ---------------------------------
//    FETCH SAFE
// ---------------------------------- */
// async function fetchJson(url: string) {
//   const res = await fetch(url, {
//     headers: { Accept: "application/json" }
//   });

//   if (res.status === 404 || res.status === 422) return null;
//   if (!res.ok) throw new Error(`PDBe API failed (${res.status})`);

//   return res.json();
// }

// /* ---------------------------------
//    CLEANER (DEPTH-AWARE)
// ---------------------------------- */
// function clean(value: any, depth = 0): any {
//   const limit = depth === 0 ? DEFAULT_LIMIT : 3;

//   if (Array.isArray(value)) {
//     const cleaned = value
//       .map(v => clean(v, depth + 1))
//       .filter(v => v !== null)
//       .slice(0, limit);

//     return cleaned.length ? cleaned : null;
//   }

//   if (value && typeof value === "object") {
//     const obj: any = {};
//     for (const [k, v] of Object.entries(value)) {
//       const cleaned = clean(v, depth + 1);
//       if (cleaned !== null) obj[k] = cleaned;
//     }
//     return Object.keys(obj).length ? obj : null;
//   }

//   if (value === undefined || value === "") return null;
//   return value;
// }

// /* ---------------------------------
//    NORMALIZE TOP-LEVEL SHAPES
// ---------------------------------- */
// function normalizeTop(raw: any) {
//   if (!raw || typeof raw !== "object") return [];

//   // sequence_conservation, llm_annotations
//   if (raw.data && !Array.isArray(raw)) {
//     return [
//       {
//         id: raw.identifier || "global",
//         payload: raw
//       }
//     ];
//   }

//   // all additionalPropX-style APIs
//   return Object.entries(raw).map(([id, payload]) => ({
//     id,
//     payload
//   }));
// }

// /* ---------------------------------
//    EXTRACT MEANINGFUL PAYLOAD
// ---------------------------------- */
// function extractPayload(action: string, payload: any) {
//   switch (action) {
//     case "ligand_sites":
//     case "interface_residues":
//     case "domains":
//       return payload?.data;

//     case "annotations":
//     case "unipdb":
//       return payload?.data;

//     case "variation":
//       return payload?.features;

//     case "complexes":
//     case "best_structures":
//     case "best_non_overlapping_structures":
//     case "similar_proteins":
//     case "superposition":
//       return payload;

//     case "secondary_structures":
//     case "secondary_structures_variation":
//     case "flexibility":
//       return payload?.data;

//     case "ligands":
//     case "interaction_partners":
//       return Object.values(payload || {});

//     case "sequence_conservation":
//     case "llm_annotations":
//       return payload;

//     case "summary_stats":
//     case "processed_proteins":
//     case "annotation_partners":
//       return payload;

//     default:
//       return payload;
//   }
// }

// /* ---------------------------------
//    HANDLER
// ---------------------------------- */
// export class PDBeUniProtHandler {
//   async run(args: {
//     action:
//       | "ligand_sites"
//       | "structures"
//       | "structures_pfam"
//       | "complexes"
//       | "best_structures"
//       | "best_non_overlapping_structures"
//       | "ligands"
//       | "interface_residues"
//       | "interaction_partners"
//       | "secondary_structures"
//       | "secondary_structures_variation"
//       | "flexibility"
//       | "domains"
//       | "unipdb"
//       | "annotations"
//       | "sequence_conservation"
//       | "sequence_conservation_residue"
//       | "similar_proteins"
//       | "superposition"
//       | "variation"
//       | "summary_stats"
//       | "processed_proteins"
//       | "annotation_partners"
//       | "llm_annotations"
//       | "llm_annotations_residue";
//     uniprot_accession: string;
//     residue_number?: number;
//     annotation_category?: string;
//   }) {
//     let url = "";

//     /* ---------------------------------
//        URL ROUTING
//     ---------------------------------- */
//     switch (args.action) {
//       case "ligand_sites":
//         url = `${BASE_URL}/uniprot/ligand_sites/${args.uniprot_accession}`;
//         break;
//       case "structures":
//         url = `${BASE_URL}/uniprot/${args.uniprot_accession}`;
//         break;
//       case "complexes":
//         url = `${BASE_URL}/uniprot/complex/${args.uniprot_accession}`;
//         break;
//       case "best_structures":
//         url = `${BASE_URL}/uniprot/best_structures/${args.uniprot_accession}`;
//         break;
//       case "best_non_overlapping_structures":
//         url = `${BASE_URL}/uniprot/best_non_overlapping_structures/${args.uniprot_accession}`;
//         break;
//       case "ligands":
//         url = `${BASE_URL}/uniprot/ligands/${args.uniprot_accession}`;
//         break;
//       case "interface_residues":
//         url = `${BASE_URL}/uniprot/interface_residues/${args.uniprot_accession}`;
//         break;
//       case "interaction_partners":
//         url = `${BASE_URL}/uniprot/interaction_partners/${args.uniprot_accession}`;
//         break;
//       case "secondary_structures":
//         url = `${BASE_URL}/uniprot/secondary_structures/${args.uniprot_accession}`;
//         break;
//       case "secondary_structures_variation":
//         url = `${BASE_URL}/uniprot/secondary_structures/variation/${args.uniprot_accession}`;
//         break;
//       case "flexibility":
//         url = `${BASE_URL}/uniprot/flexibility_predictions/${args.uniprot_accession}`;
//         break;
//       case "domains":
//         url = `${BASE_URL}/uniprot/domains/${args.uniprot_accession}`;
//         break;
//       case "unipdb":
//         url = `${BASE_URL}/uniprot/unipdb/${args.uniprot_accession}`;
//         break;
//       case "annotations":
//         url = `${BASE_URL}/uniprot/annotations/${args.uniprot_accession}${
//           args.annotation_category
//             ? `?annotation_category=${encodeURIComponent(
//                 args.annotation_category
//               )}`
//             : ""
//         }`;
//         break;
//       case "sequence_conservation":
//         url = args.residue_number
//           ? `${BASE_URL}/uniprot/sequence_conservation/${args.uniprot_accession}/${args.residue_number}`
//           : `${BASE_URL}/uniprot/sequence_conservation/${args.uniprot_accession}`;
//         break;
//       case "similar_proteins":
//         url = `${BASE_URL}/uniprot/similar_proteins/${args.uniprot_accession}`;
//         break;
//       case "superposition":
//         url = `${BASE_URL}/uniprot/superposition/${args.uniprot_accession}`;
//         break;
//       case "variation":
//         url = `${BASE_URL}/uniprot/variation/${args.uniprot_accession}`;
//         break;
//       case "summary_stats":
//         url = `${BASE_URL}/uniprot/summary_stats/${args.uniprot_accession}`;
//         break;
//       case "processed_proteins":
//         url = `${BASE_URL}/uniprot/processed_proteins/${args.uniprot_accession}`;
//         break;
//       case "annotation_partners":
//         url = `${BASE_URL}/uniprot/annotation_partners/${args.uniprot_accession}`;
//         break;
//       case "llm_annotations":
//         url = `${BASE_URL}/uniprot/llm_annotations/summary/${args.uniprot_accession}`;
//         break;
//       default:
//         throw new Error("Unknown action");
//     }

//     const raw = await fetchJson(url);
//     if (!raw) {
//       return {
//         content: [{ type: "text", text: "No meaningful data available" }]
//       };
//     }

//     /* ---------------------------------
//        CLEAN PIPELINE
//     ---------------------------------- */
//     const data = normalizeTop(raw)
//       .map(({ id, payload }) => ({
//         id,
//         payload: extractPayload(args.action, payload)
//       }))
//       .map(item => ({
//         id: item.id,
//         payload: clean(item.payload)
//       }))
//       .filter(item => item.payload !== null)
//       .slice(0, MAX_LIMIT);

//     const finalData = data.length ? data : null;

//     /* ---------------------------------
//        MCP RESPONSE
//     ---------------------------------- */
//     return {
//       structuredContent: {
//         action: args.action,
//         accession: args.uniprot_accession,
//         data: finalData
//       },
//       content: [
//         {
//           type: "text",
//           text: JSON.stringify(
//             {
//               action: args.action,
//               accession: args.uniprot_accession,
//               data: finalData
//             },
//             null,
//             2
//           )
//         }
//       ]
//     };
//   }
// }


import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/pdbe/api";

/* ---------------------------------
   HARD LIMITS
---------------------------------- */
const TOP_LIMIT = 3;
const NESTED_LIMIT = 3;

/* ---------------------------------
   FETCH SAFE
---------------------------------- */
async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (res.status === 404 || res.status === 422) return null;
  if (!res.ok) throw new Error(`PDBe API failed (${res.status})`);
  return res.json();
}

/* ---------------------------------
   CLEANER (NO EMPTY, DEPTH AWARE)
---------------------------------- */
function clean(value: any, depth = 0): any {
  const limit = depth === 0 ? TOP_LIMIT : NESTED_LIMIT;

  if (Array.isArray(value)) {
    const out = value
      .map(v => clean(v, depth + 1))
      .filter(v => v !== null)
      .slice(0, limit);
    return out.length ? out : null;
  }

  if (value && typeof value === "object") {
    const obj: any = {};
    for (const [k, v] of Object.entries(value)) {
      const c = clean(v, depth + 1);
      if (c !== null) obj[k] = c;
    }
    return Object.keys(obj).length ? obj : null;
  }

  return value ?? null;
}

/* ---------------------------------
   NORMALIZE (NO ASSUMPTIONS)
---------------------------------- */
function normalize(raw: any) {
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw).map(([id, payload]) => ({ id, payload }));
}

/* ---------------------------------
   EXTRACT (CURL-TRUTH BASED)
---------------------------------- */
function extract(action: string, payload: any) {
  switch (action) {

    /* 5 */
    case "best_non_overlapping_structures":
    case "non_overlapping_structures":
      return Array.isArray(payload) ? payload.slice(0, TOP_LIMIT) : null;

    /* 9 */
    case "secondary_structures":
      return payload?.data?.slice(0, TOP_LIMIT);

    /* 10 */
    case "secondary_structures_variation":
      return payload?.data?.slice(0, TOP_LIMIT);

    /* 11 (CORRECT ENDPOINT SHAPE) */
    case "flexibility":
      return payload?.data?.slice(0, TOP_LIMIT);

    /* 14 */
    case "annotations":
      return payload?.data?.slice(0, TOP_LIMIT).map((a: any) => ({
        ...a,
        residues: a.residues?.slice(0, NESTED_LIMIT)
      }));

    /* 16 */
    case "sequence_conservation_residue":
      return payload?.data
        ? {
            index: payload.data.index?.slice(0, 1),
            conservation_score: payload.data.conservation_score?.slice(0, 1)
          }
        : null;

    /* 17 */
    case "similar_proteins":
      return Array.isArray(payload) ? payload.slice(0, TOP_LIMIT) : null;

    /* 23 */
    case "llm_annotations":
      return payload?.slice(0, TOP_LIMIT).map((e: any) => ({
        pdbId: e.pdbId,
        providerList: e.providerList?.slice(0, 1).map((p: any) => ({
          provider: p.provider,
          residueList: p.residueList?.slice(0, 1).map((r: any) => ({
            startIndex: r.startIndex,
            endIndex: r.endIndex,
            additionalData: r.additionalData?.slice(0, 1).map((d: any) => ({
              sentence: d.sentence,
              pubmedId: d.pubmedId,
              aiScore: d.aiScore
            }))
          }))
        }))
      }));

    /* 24 */
    case "llm_annotations_residue":
      return payload?.slice(0, TOP_LIMIT) ?? null;

    /* others */
    case "ligand_sites":
    case "interface_residues":
    case "domains":
      return payload?.data;

    case "variation":
      return payload?.features?.slice(0, TOP_LIMIT);

    case "ligands":
    case "interaction_partners":
      return Object.values(payload || {}).slice(0, TOP_LIMIT);

    default:
      return payload;
  }
}

/* ---------------------------------
   HANDLER
---------------------------------- */
export class PDBeUniProtHandler {
  async run(args: {
    action:
      | "ligand_sites"
      | "structures"
      | "structures_pfam"
      | "complexes"
      | "best_structures"
      | "best_non_overlapping_structures"
      | "non_overlapping_structures"
      | "ligands"
      | "interface_residues"
      | "interaction_partners"
      | "secondary_structures"
      | "secondary_structures_variation"
      | "flexibility"
      | "domains"
      | "unipdb"
      | "annotations"
      | "sequence_conservation"
      | "sequence_conservation_residue"
      | "similar_proteins"
      | "superposition"
      | "variation"
      | "summary_stats"
      | "processed_proteins"
      | "annotation_partners"
      | "llm_annotations"
      | "llm_annotations_residue";
    uniprot_accession: string;
    residue_number?: number;
  }) {
    let url = "";

    switch (args.action) {
      case "ligand_sites":
        url = `${BASE_URL}/uniprot/ligand_sites/${args.uniprot_accession}`;
        break;

      case "structures":
        url = `${BASE_URL}/uniprot/${args.uniprot_accession}`;
        break;

      case "structures_pfam":
        url = `${BASE_URL}/uniprot/pfam/${args.uniprot_accession}`;
        break;

      case "complexes":
        url = `${BASE_URL}/uniprot/complex/${args.uniprot_accession}`;
        break;

      case "best_structures":
        url = `${BASE_URL}/uniprot/best_structures/${args.uniprot_accession}`;
        break;

      case "best_non_overlapping_structures":
      case "non_overlapping_structures":
        url = `${BASE_URL}/uniprot/best_non_overlapping_structures/${args.uniprot_accession}`;
        break;

      case "secondary_structures":
        url = `${BASE_URL}/uniprot/secondary_structures/${args.uniprot_accession}`;
        break;

      case "secondary_structures_variation":
        url = `${BASE_URL}/uniprot/secondary_structures/variation/${args.uniprot_accession}`;
        break;

      case "flexibility":
        url = `${BASE_URL}/uniprot/flexibility_predictions/${args.uniprot_accession}`;
        break;

      case "sequence_conservation":
        url = `${BASE_URL}/uniprot/sequence_conservation/${args.uniprot_accession}`;
        break;

      case "sequence_conservation_residue":
        if (!args.residue_number) throw new Error("residue_number required");
        url = `${BASE_URL}/uniprot/sequence_conservation/${args.uniprot_accession}/${args.residue_number}`;
        break;

      case "llm_annotations":
        url = `${BASE_URL}/uniprot/llm_annotations/summary/${args.uniprot_accession}`;
        break;

      case "llm_annotations_residue":
        if (!args.residue_number) throw new Error("residue_number required");
        url = `${BASE_URL}/uniprot/llm_annotations/residue/${args.uniprot_accession}/${args.residue_number}`;
        break;

      default:
        url = `${BASE_URL}/uniprot/${args.action}/${args.uniprot_accession}`;
    }

    const raw = await fetchJson(url);
    if (!raw) {
      return { content: [{ type: "text", text: "No meaningful data available" }] };
    }

    const data = normalize(raw)
      .map(({ id, payload }) => ({
        id,
        payload: clean(extract(args.action, payload))
      }))
      .filter(v => v.payload !== null)
      .slice(0, TOP_LIMIT);

    return {
      structuredContent: {
        action: args.action,
        accession: args.uniprot_accession,
        data: data.length ? data : null
      },
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              action: args.action,
              accession: args.uniprot_accession,
              data: data.length ? data : null
            },
            null,
            2
          )
        }
      ]
    };
  }
}

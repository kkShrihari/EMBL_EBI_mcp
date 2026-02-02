import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/pdbe/api";

/* ---------------------------------
   LIMITS (GLOBAL CONTRACT)
---------------------------------- */
const TOP_LIMIT = 3;
const NESTED_LIMIT = 3;
const RESIDUE_LIMIT = 1;

/* ---------------------------------
   FETCH SAFE
---------------------------------- */
async function fetchJson(
  url: string,
  method: "GET" | "POST" = "GET",
  body?: any
) {
  const res = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status === 404 || res.status === 422) return null;
  if (!res.ok) throw new Error(`PDBe validation failed (${res.status})`);

  return res.json();
}

/* ---------------------------------
   CLEANER (DEPTH + RESIDUE AWARE)
---------------------------------- */
function clean(value: any, depth = 0, residueHeavy = false): any {
  const limit =
    residueHeavy && depth > 0 ? RESIDUE_LIMIT : NESTED_LIMIT;

  if (Array.isArray(value)) {
    const cleaned = value
      .map(v => clean(v, depth + 1, residueHeavy))
      .filter(v => v !== null)
      .slice(0, limit);
    return cleaned.length ? cleaned : null;
  }

  if (value && typeof value === "object") {
    const obj: any = {};
    for (const [k, v] of Object.entries(value)) {
      const cleaned = clean(v, depth + 1, residueHeavy);
      if (cleaned !== null) obj[k] = cleaned;
    }
    return Object.keys(obj).length ? obj : null;
  }

  if (value === undefined || value === "") return null;
  return value;
}

/* ---------------------------------
   NORMALIZE TOP-LEVEL
---------------------------------- */
function normalizeTop(raw: any) {
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw).map(([id, payload]) => ({ id, payload }));
}

/* ---------------------------------
   HANDLER
---------------------------------- */
export class PDBeMappingsAndTopologyHandler {
  async run(args: {
    action:
      | "mappings_ensembl_to_pdb"
      | "mappings_isoforms"
      | "mappings_all_isoforms"
      | "mappings_uniref90"
      | "mappings_homologene_uniref90"
      | "mappings_uniprot"
      | "mappings_interpro"
      | "mappings_pfam"
      | "mappings_cath"
      | "mappings_cath_b"
      | "mappings_scop"
      | "mappings_scop2"
      | "mappings_scop2b"
      | "mappings_go"
      | "mappings_ec"
      | "mappings_ensembl"
      | "mappings_hmmer"
      | "mappings_sequence_domains"
      | "mappings_structural_domains"
      | "mappings_generic"
      | "mappings_homologene"
      | "best_structures_get"
      | "best_structures_post"
      | "uniprot_to_pfam"
      | "uniprot_segments"
      | "uniprot_publications"
      | "topology_entry"
      | "topology_chain";
    pdb_id?: string;
    chain_id?: string;
    accession?: string;
    gene_id?: string;
    entity_id?: number;
    uniprot_accession?: string;
    body?: any;
  }) {
    let url = "";
    let method: "GET" | "POST" = "GET";

    switch (args.action) {
      case "mappings_ensembl_to_pdb":
        url = `${BASE_URL}/mappings/ensembl_to_pdb/${args.gene_id}`;
        break;

      case "mappings_isoforms":
        url = `${BASE_URL}/mappings/isoforms/${args.pdb_id}`;
        break;

      case "mappings_all_isoforms":
        url = `${BASE_URL}/mappings/all_isoforms/${args.accession}`;
        break;

      case "mappings_uniref90":
        url = `${BASE_URL}/mappings/uniref90/${args.pdb_id}`;
        break;

      case "mappings_homologene_uniref90":
        url = `${BASE_URL}/mappings/homologene_uniref90/${args.pdb_id}`;
        break;

      case "mappings_uniprot":
        url = `${BASE_URL}/mappings/uniprot/${args.pdb_id}`;
        break;

      case "mappings_interpro":
        url = `${BASE_URL}/mappings/interpro/${args.pdb_id}`;
        break;

      case "mappings_pfam":
        url = `${BASE_URL}/mappings/pfam/${args.pdb_id}`;
        break;

      case "mappings_cath":
        url = `${BASE_URL}/mappings/cath/${args.pdb_id}`;
        break;

      case "mappings_cath_b":
        url = `${BASE_URL}/mappings/cath_b/${args.pdb_id}`;
        break;

      case "mappings_scop":
        url = `${BASE_URL}/mappings/scop/${args.pdb_id}`;
        break;

      case "mappings_scop2":
        url = `${BASE_URL}/mappings/scop2/${args.pdb_id}`;
        break;

      case "mappings_scop2b":
        url = `${BASE_URL}/mappings/scop2b/${args.pdb_id}`;
        break;

      case "mappings_go":
        url = `${BASE_URL}/mappings/go/${args.pdb_id}`;
        break;

      case "mappings_ec":
        url = `${BASE_URL}/mappings/ec/${args.pdb_id}`;
        break;

      case "mappings_ensembl":
        url = `${BASE_URL}/mappings/ensembl/${args.pdb_id}`;
        break;

      case "mappings_hmmer":
        url = `${BASE_URL}/mappings/hmmer/${args.pdb_id}`;
        break;

      case "mappings_sequence_domains":
        url = `${BASE_URL}/mappings/sequence_domains/${args.pdb_id}`;
        break;

      case "mappings_structural_domains":
        url = `${BASE_URL}/mappings/structural_domains/${args.pdb_id}`;
        break;

      case "mappings_generic":
        url = `${BASE_URL}/mappings/${args.accession}`;
        break;

      case "mappings_homologene":
        url = `${BASE_URL}/mappings/homologene/${args.pdb_id}/${args.entity_id}`;
        break;

      case "best_structures_get":
        url = `${BASE_URL}/mappings/best_structures/${args.uniprot_accession}`;
        break;

      case "best_structures_post":
        method = "POST";
        url = `${BASE_URL}/mappings/best_structures`;
        break;

      case "uniprot_to_pfam":
        url = `${BASE_URL}/mappings/uniprot_to_pfam/${args.uniprot_accession}`;
        break;

      case "uniprot_segments":
        url = `${BASE_URL}/mappings/uniprot_segments/${args.pdb_id}`;
        break;

      case "uniprot_publications":
        url = `${BASE_URL}/mappings/uniprot_publications/${args.uniprot_accession}`;
        break;

      case "topology_entry":
        url = `${BASE_URL}/topology/entry/${args.pdb_id}`;
        break;

      case "topology_chain":
        url = `${BASE_URL}/topology/entry/${args.pdb_id}/chain/${args.chain_id}`;
        break;

      default:
        throw new Error("Unknown mappings/topology action");
    }

    const raw = await fetchJson(url, method, args.body);

    if (!raw || Object.keys(raw).length === 0) {
      return {
        content: [{ type: "text", text: "No meaningful data available" }]
      };
    }

    const data = normalizeTop(raw)
      .map(({ id, payload }) => ({
        id,
        payload: clean(payload)
      }))
      .filter(x => x.payload !== null)
      .slice(0, TOP_LIMIT);

    const response = {
      action: args.action,
      accession:
        args.pdb_id ??
        args.accession ??
        args.uniprot_accession ??
        args.gene_id ??
        null,
      data: data.length ? data : null
    };

    return {
      structuredContent: response,
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2)
        }
      ]
    };
  }
}

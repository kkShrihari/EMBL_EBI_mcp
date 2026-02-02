import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/pdbe/api";

/* ---------------------------------
   FETCH HELPERS
---------------------------------- */
async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" }
  });

  if (res.status === 404 || res.status === 422) return {};
  if (!res.ok) throw new Error(`PDBe API failed (${res.status})`);

  return res.json();
}

async function fetchPostJson(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (res.status === 404 || res.status === 422) return {};
  if (!res.ok) throw new Error(`PDBe API failed (${res.status})`);

  return res.json();
}

/* ---------------------------------
   SIZE CONTROLS
---------------------------------- */
function normalizeSize(size?: number) {
  if (!size) return 3;
  return Math.min(Math.max(size, 1), 10);
}

function limitSub<T>(arr?: T[], max = 5): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, max);
}

function normalizeObject(input: any): any[] {
  if (!input || typeof input !== "object") return [];
  return Object.values(input).flat();
}

/* ---------------------------------
   SUMMARIZERS
---------------------------------- */

// ---- SIMILARITY ----
function summarizeSimilarity(entry: any) {
  return {
    stereoisomers: limitSub(
      entry.stereoisomers?.map((s: any) => ({
        chemCompId: s.chem_comp_id,
        name: s.name
      }))
    ),
    sameScaffold: limitSub(
      entry.same_scaffold?.map((s: any) => ({
        chemCompId: s.chem_comp_id,
        name: s.name,
        similarity: s.similarity_score
      }))
    ),
    similarLigands: limitSub(
      entry.similar_ligands?.map((s: any) => ({
        chemCompId: s.chem_comp_id,
        name: s.name,
        similarity: s.similarity_score
      }))
    )
  };
}

// ---- SUBSTRUCTURES ----
function summarizeSubstructures(entry: any) {
  return {
    fragments: limitSub(
      entry.fragments?.map((f: any) => ({
        name: f.name,
        smiles: f.descriptors?.smiles
      }))
    ),
    scaffolds: limitSub(
      entry.scaffolds?.map((s: any) => ({
        name: s.name,
        smiles: s.descriptors?.smiles
      }))
    )
  };
}

// ---- SUMMARY ----
function summarizeCompound(entry: any) {
  return {
    name: entry.name,
    formula: entry.formula,
    smiles: entry.smiles,
    inchiKey: entry.inchi_key,
    released: entry.released,
    synonyms: limitSub(entry.synonyms?.map((s: any) => s.value)),
    physChem: entry.phys_chem_properties
      ? {
          exactMw: entry.phys_chem_properties.exactmw,
          clogP: entry.phys_chem_properties.crippen_clog_p,
          hba: entry.phys_chem_properties.num_hba,
          hbd: entry.phys_chem_properties.num_hbd
        }
      : null
  };
}

// ---- INTERACTIONS ----
function summarizeInteractions(entry: any) {
  return limitSub(
    normalizeObject(entry).map((i: any) => ({
      atom: i.atom,
      residue: i.residue,
      count: i.count
    }))
  );
}

// ---- UNIPROT ----
function summarizeUniprot(entry: any) {
  return {
    uniprotId: entry.uniprot_id,
    name: entry.name,
    organism: entry.organism?.scientific_name,
    ecNumbers: limitSub(entry.ec_numbers),
    annotations: limitSub(entry.annotations),
    ligandInstances: entry.num_ligand_instances,
    interactingChains: limitSub(
      entry.interacting_chains?.map((c: any) => ({
        pdbId: c.pdb_id,
        chain: c.auth_asym_id
      }))
    )
  };
}

/* ---------------------------------
   HANDLER
---------------------------------- */
export class PDBeCompoundsHandler {
  async run(args: {
    action:
      | "similarity"
      | "substructures"
      | "summary"
      | "interaction"
      | "uniprot"
      | "substructures_bulk";
    hetcode?: string;
    hetcodes?: string;
    size?: number;
  }) {
    const size = normalizeSize(args.size);

    let url = "";
    let raw: any;

    switch (args.action) {
      case "similarity":
        url = `${BASE_URL}/compound/similarity/${args.hetcode}`;
        raw = await fetchJson(url);
        break;

      case "substructures":
        url = `${BASE_URL}/compound/substructures/${args.hetcode}`;
        raw = await fetchJson(url);
        break;

      case "summary":
        url = `${BASE_URL}/compound/summary/${args.hetcode}`;
        raw = await fetchJson(url);
        break;

      case "interaction":
        url = `${BASE_URL}/compound/interaction/${args.hetcode}`;
        raw = await fetchJson(url);
        break;

      case "uniprot":
        url = `${BASE_URL}/compound/uniprot/${args.hetcode}`;
        raw = await fetchJson(url);
        break;

      case "substructures_bulk":
        url = `${BASE_URL}/pdb/compound/substructures`;
        raw = await fetchPostJson(url, args.hetcodes);
        break;

      default:
        throw new Error("Unknown action");
    }

    const result = limitSub(
      Object.entries(raw).map(([id, entry]: any) => {
        switch (args.action) {
          case "similarity":
            return { hetcode: id, ...summarizeSimilarity(entry[0]) };

          case "substructures":
          case "substructures_bulk":
            return { hetcode: id, ...summarizeSubstructures(entry) };

          case "summary":
            return { hetcode: id, ...summarizeCompound(entry[0]) };

          case "interaction":
            return { hetcode: id, interactions: summarizeInteractions(entry) };

          case "uniprot":
            return {
              hetcode: id,
              proteins: limitSub(entry.map(summarizeUniprot))
            };
        }
      }),
      size
    );

    return {
      structuredContent: {
        action: args.action,
        count: result.length,
        data: result
      },
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              action: args.action,
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

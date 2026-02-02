import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/pdbe/api";

/* ---------------------------------
   FETCH HELPER
---------------------------------- */
async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" }
  });

  if (res.status === 404 || res.status === 422) {
    return {};
  }

  if (!res.ok) {
    throw new Error(`PDBe API failed (${res.status})`);
  }

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

/* ---------------------------------
   SUMMARIZERS
---------------------------------- */
function summarizeResidueRange(r: any) {
  return {
    chainId: r.chain_id,
    entityId: r.entity_id,
    structAsymId: r.struct_asym_id,
    start: {
      residue_number: r.start?.residue_number,
      author_residue_number: r.start?.author_residue_number,
      author_insertion_code: r.start?.author_insertion_code || null
    },
    end: {
      residue_number: r.end?.residue_number,
      author_residue_number: r.end?.author_residue_number,
      author_insertion_code: r.end?.author_insertion_code || null
    }
  };
}

/* ---------------------------------
   HANDLER
---------------------------------- */
export class PDBeRfamMappingsHandler {
  async run(args: {
    action: "rfam" | "sequence_domains" | "accession";
    pdb_id?: string;
    accession?: string;
    size?: number;
  }) {
    const size = normalizeSize(args.size);

    let url = "";
    let id = "";

    switch (args.action) {
      case "rfam":
        if (!args.pdb_id) throw new Error("pdb_id is required");
        url = `${BASE_URL}/nucleic_mappings/rfam/${args.pdb_id}`;
        id = args.pdb_id;
        break;

      case "sequence_domains":
        if (!args.pdb_id) throw new Error("pdb_id is required");
        url = `${BASE_URL}/nucleic_mappings/sequence_domains/${args.pdb_id}`;
        id = args.pdb_id;
        break;

      case "accession":
        if (!args.accession) throw new Error("accession is required");
        url = `${BASE_URL}/nucleic_mappings/${args.accession}`;
        id = args.accession;
        break;

      default:
        throw new Error("Unknown action");
    }

    const raw = await fetchJson(url);

    let data: any[] = [];

    /* ---------- RFAM ---------- */
    if (args.action === "rfam") {
      data = limitSub(
        Object.values(raw).flatMap((entry: any) =>
          Object.entries(entry.Rfam ?? {}).map(
            ([rfamId, rfam]: any) => ({
              domainId: rfamId,
              identifier: rfam.identifier,
              family: rfam.family,
              clan: rfam.clan,
              clanIdentifier: rfam.clan_identifier,
              mappings: limitSub(
                (rfam.mappings ?? []).map(summarizeResidueRange)
              )
            })
          )
        ),
        size
      );
    }

    /* ---------- SEQUENCE DOMAINS ---------- */
    if (args.action === "sequence_domains") {
      data = limitSub(
        Object.values(raw).flatMap((entry: any) =>
          Object.entries(entry.PDB ?? {}).map(
            ([domainId, mappings]: any) => ({
              domainId,
              mappings: limitSub(
                (mappings ?? []).map(summarizeResidueRange)
              )
            })
          )
        ),
        size
      );
    }

    /* ---------- ACCESSION ---------- */
    if (args.action === "accession") {
      data = limitSub(
        Object.entries(raw).flatMap(([domainId, entry]: any) =>
          Object.entries(entry.PDB ?? {}).map(
            ([pdbId, mappings]: any) => ({
              domainId: pdbId,
              mappings: limitSub(
                (mappings ?? []).map(summarizeResidueRange)
              )
            })
          )
        ),
        size
      );
    }

    return {
      structuredContent: {
        action: args.action,
        id,
        count: data.length,
        data
      },
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              action: args.action,
              id,
              count: data.length,
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

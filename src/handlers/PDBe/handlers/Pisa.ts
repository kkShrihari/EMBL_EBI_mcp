import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/pdbe/api";

/* ---------------------------------
   FETCH HELPER
---------------------------------- */
async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" }
  });

  // Graceful biological empties
  if (res.status === 404 || res.status === 422) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`PDBe API failed (${res.status})`);
  }

  return res.json();
}

/* ---------------------------------
   LIMIT HELPERS
---------------------------------- */
function limitSub<T>(arr?: T[], max = 5): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, max);
}

/* ---------------------------------
   BOND SUMMARIZER
---------------------------------- */
function summarizeBondBlock(block: any, max = 5) {
  if (!block || typeof block !== "object") return null;

  const total = block.bond_distances?.length ?? 0;

  const bonds = limitSub(
    (block.bond_distances ?? []).map((_: any, i: number) => ({
      distance: block.bond_distances?.[i],
      atom1: {
        chain: block.atom_site_1_chains?.[i],
        residue: block.atom_site_1_residues?.[i],
        uniprot: block.atom_site_1_unp_accs?.[i],
        uniprot_pos: block.atom_site_1_unp_nums?.[i]
      },
      atom2: {
        chain: block.atom_site_2_chains?.[i],
        residue: block.atom_site_2_residues?.[i],
        uniprot: block.atom_site_2_unp_accs?.[i],
        uniprot_pos: block.atom_site_2_unp_nums?.[i]
      }
    })),
    max
  );

  return {
    totalCount: total,
    shownCount: bonds.length,
    truncated: total > bonds.length,
    bonds
  };
}


/* ---------------------------------
   HANDLER
---------------------------------- */
export class PDBePisaInterfaceHandler {
  async run(args: {
    pdb_id: string;
    assembly_id: number;
    interface_id: number;
  }) {
    const { pdb_id, assembly_id, interface_id } = args;

    if (!pdb_id || assembly_id == null || interface_id == null) {
      throw new Error("pdb_id, assembly_id and interface_id are required");
    }

    const url = `${BASE_URL}/pisa/interface/${pdb_id}/${assembly_id}/${interface_id}`;
    const data = await fetchJson(url);

    if (!data) {
      return {
        structuredContent: {
          pdb_id,
          assembly_id,
          interface_id,
          count: 0,
          data: []
        },
        content: [{ type: "text", text: "[]" }]
      };
    }

    const result = {
      interfaceId: data.interface_id,
      interfaceArea: data.interface_area,
      solvationEnergy: data.solvation_energy,
      stabilizationEnergy: data.stabilization_energy,
      pValue: data.p_value,
      residueCount: data.number_interface_residues,
      bonds: {
        hydrogen: summarizeBondBlock(data.hydrogen_bonds),
        salt: summarizeBondBlock(data.salt_bridges),
        disulfide: summarizeBondBlock(data.disulfide_bonds),
        covalent: summarizeBondBlock(data.covalent_bonds),
        other: summarizeBondBlock(data.other_bonds)
      },
      molecules: limitSub(
        data.molecules?.map((m: any) => ({
          moleculeId: m.molecule_id,
          moleculeClass: m.molecule_class,
          chainId: m.chain_id,
          residueCount: m.residue_seq_ids?.length ?? 0,
          buriedSurfaceArea: limitSub(m.buried_surface_areas),
          solvationEnergy: limitSub(m.solvation_energies)
        }))
      )
    };

    return {
      structuredContent: {
        pdb_id,
        assembly_id,
        interface_id,
        count: 1,
        data: [result]
      },
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              pdb_id,
              assembly_id,
              interface_id,
              data: [result]
            },
            null,
            2
          )
        }
      ]
    };
  }
}

import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/pdbe/api";

/* ---------------------------------
   FETCH HELPER
---------------------------------- */
async function fetchJson(url: string) {
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

// -------- SYMMETRY --------
function summarizeSymmetry(entry: any) {
  return {
    assemblyId: entry.assembly_id,
    symbol: entry.symbol,
    type: entry.type,
    oligomericState: entry.oligomeric_state,
    stoichiometry: entry.stoichiometry,
    rotationAxes: limitSub(
      entry.rotation_axes?.map((a: any) => ({
        order: a.order,
        start: a.start,
        end: a.end
      }))
    )
  };
}

// -------- COMPLEX DETAILS --------
function summarizeComplex(entry: any) {
  return {
    name: entry.name,
    pdbComplexId: entry.pdb_complex_id,
    complexPortalId: entry.complex_portal_id,
    organism: entry.source_organism,
    oligomericState: entry.oligomeric_state,
    totalChains: entry.total_chains,
    polymerComposition: entry.polymer_composition,
    representativeStructure: entry.representative_structure,
    symmetry: entry.symmetry,
    participants: limitSub(
      entry.participants?.map((p: any) => ({
        accession: p.accession,
        stoichiometry: p.stoichiometry,
        type: p.accession_type,
        name: p.name,
        gene: p.gene_name
      }))
    ),
    assemblies: limitSub(
      entry.assemblies?.map((a: any) => ({
        pdbId: a.pdb_id,
        assemblyId: a.assembly_id,
        preferred: a.preferred_assembly,
        method: a.experimental_method,
        resolution: a.resolution,
        symmetry: a.symmetry,
        boundMacromolecules: limitSub(a.bound_macromolecules)
      }))
    ),
    subcomplexes: limitSub(entry.subcomplexes),
    supercomplexes: limitSub(entry.supercomplexes)
  };
}

// -------- BOUND MOLECULES --------
function summarizeBoundMolecule(ligandId: string, entry: any) {
  return {
    ligandId,
    name: entry.name,
    annotations: limitSub(entry.annotations),
    numPdbEntries: entry.num_pdb_entries,
    numChains: entry.num_chains,
    numLigandInstances: entry.num_ligand_instances
  };
}

// -------- INTERACTIONS --------
function summarizeInteraction(entry: any) {
  return {
    pdbComplexId: entry.pdb_complex_id,
    name: entry.name,
    relationship: entry.relationship_type,
    representativeStructure: entry.representative_structure,
    commonParticipants: limitSub(entry.common_participants),
    additionalParticipants: limitSub(entry.additional_participants)
  };
}

// -------- PISA --------
function summarizePisa(key: string, entry: any) {
  return {
    assemblyKey: key,
    percentiles: {
      dissociationEnergy: entry.dissociation_energy_percentiles,
      asa: entry.accessible_surface_area_percentiles,
      bsa: entry.buried_surface_area_percentiles
    },
    data: limitSub(
      Object.values(entry.data ?? {}).map((d: any) => ({
        dissociationEnergy: d.dissociation_energy,
        asa: d.accessible_surface_area,
        bsa: d.buried_surface_area,
        method: d.experimental_method,
        resolution: d.resolution
      }))
    )
  };
}

// -------- ID HISTORY --------
function summarizeHistory(entry: any) {
  return {
    queryId: entry.query_id,
    status: entry.status,
    effectiveStatus: entry.effective_status,
    canonical: entry.canonical
  };
}

/* ---------------------------------
   HANDLER
---------------------------------- */
export class PDBeComplexHandler {
  async run(args: {
    action:
      | "symmetry"
      | "details"
      | "bound_molecules"
      | "interactions"
      | "pisa"
      | "id_history";
    id: string;
    id_type?: string;
    assembly_id?: number;
    size?: number;
  }) {
    const size = normalizeSize(args.size);
    let url = "";

    switch (args.action) {
      case "symmetry":
        url = args.assembly_id
          ? `${BASE_URL}/pdb/symmetry/${args.id}?assembly_id=${args.assembly_id}`
          : `${BASE_URL}/pdb/symmetry/${args.id}`;
        break;

      case "details":
        url = `${BASE_URL}/complex/details/${args.id}?id_type=${args.id_type}`;
        break;

      case "bound_molecules":
        url = `${BASE_URL}/complex/bound_molecules_summary/${args.id}`;
        break;

      case "interactions":
        url = `${BASE_URL}/complex/interactions/${args.id}`;
        break;

      case "pisa":
        url = `${BASE_URL}/complex/pisa_assemblies_params/${args.id}`;
        break;

      case "id_history":
        url = `${BASE_URL}/complex/id_history/${args.id}`;
        break;

      default:
        throw new Error("Unknown action");
    }

    const data: any = await fetchJson(url);
    let result: any[] = [];

    switch (args.action) {
      case "symmetry":
        result = limitSub(
          Object.values(data).flat(),
          size
        ).map(summarizeSymmetry);
        break;

      case "details":
        result = limitSub(
          Object.values(data).flat(),
          size
        ).map(summarizeComplex);
        break;

      case "bound_molecules": {
        const ligands = data?.[args.id] ?? {};
        result = limitSub(
          Object.entries(ligands).map(([ligandId, entry]) =>
            summarizeBoundMolecule(ligandId, entry)
          ),
          size
        );
        break;
      }

      case "interactions":
        result = limitSub(
          Object.values(data).flat(),
          size
        ).map(summarizeInteraction);
        break;

      case "pisa":
        result = limitSub(
          Object.entries(data).map(([k, v]) =>
            summarizePisa(k, v)
          ),
          size
        );
        break;

      case "id_history":
        result = limitSub(
          Object.values(data),
          size
        ).map(summarizeHistory);
        break;
    }

    return {
      structuredContent: {
        action: args.action,
        id: args.id,
        count: result.length,
        data: result
      },
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              action: args.action,
              id: args.id,
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

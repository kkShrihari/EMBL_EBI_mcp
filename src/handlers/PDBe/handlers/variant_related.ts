import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/pdbe/api";

/* ---------------------------------
   FETCH HELPERS
---------------------------------- */
async function fetchPostJson(url: string, body: any): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (res.status === 404 || res.status === 422) {
    return [];
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
   NORMALIZATION
---------------------------------- */
function normalizeArray(input: any): any[] {
  if (Array.isArray(input)) return input;
  if (input && typeof input === "object") return Object.values(input).flat();
  return [];
}

/* ---------------------------------
   SUMMARIZERS
---------------------------------- */

// ---- STRUCTURE ----
function summarizeStructure(s: any) {
  return {
    position: s.position,
    positionCode: s.positionCode,
    bestStructures: limitSub(s.bestStructures),
    bestStructuresCount: s.bestStructuresCount,
    description: s.description
  };
}

// ---- LIGANDS ----
function summarizeLigand(l: any) {
  return {
    position: l.position,
    positionCode: l.positionCode,
    ligandsCount: l.ligandsCount,
    ligands: limitSub(
      l.ligandsStructures?.map((x: any) => ({
        ligandId: x.ligandId,
        ligandName: x.ligandName,
        formula: x.formula,
        inChi: x.inChi,
        structures: limitSub(x.structures)
      }))
    )
  };
}

// ---- INTERACTIONS ----
function summarizeInteraction(i: any) {
  return {
    position: i.position,
    positionCode: i.positionCode,
    partnerCounts: i.partnerCounts,
    partners: limitSub(
      i.partners?.map((p: any) => ({
        accession: p.partnerAccession,
        name: p.partnerName,
        structures: limitSub(p.structures)
      }))
    )
  };
}

// ---- ANNOTATIONS ----
function summarizeAnnotation(a: any) {
  return {
    position: a.position,
    positionCode: a.positionCode,
    resourceCounts: a.dataResourceCounts,
    resources: limitSub(a.dataResources)
  };
}

// ---- RESIDUE ANNOTATION ----
function summarizeResidueAnnotation(r: any) {
  return {
    structure: r.structure ? summarizeStructure(r.structure) : null,
    ligand: r.ligand ? summarizeLigand(r.ligand) : null,
    interaction: r.interaction ? summarizeInteraction(r.interaction) : null,
    annotation: r.annotation ? summarizeAnnotation(r.annotation) : null
  };
}

// ---- ALL STRUCTURES (FIXED) ----
function summarizeAllStructures(allStructures: any) {
  return limitSub(
    Object.entries(allStructures ?? {}).map(([pdbId, chains]) => ({
      pdbId,
      chains: limitSub(
        normalizeArray(chains).map((c: any) => ({
          entityId: c.entityId,
          chainId: c.chainId,
          residueRange: c.residueRange
        }))
      )
    }))
  );
}

/* ---------------------------------
   HANDLER
---------------------------------- */
export class PDBeVariantRelatedHandler {
  async run(args: {
    action: "structures" | "summary_stats";
    payload: {
      accession: string;
      positions: string[];
    }[];
    size?: number;
  }) {
    const size = normalizeSize(args.size);

    const url =
      args.action === "structures"
        ? `${BASE_URL}/pepvep/structures`
        : `${BASE_URL}/pepvep/summary_stats`;

    const data = await fetchPostJson(url, args.payload);

    const result = limitSub(
      normalizeArray(data).map((entry: any) => ({
        accession: entry.accession,
        length: entry.length,
        residueAnnotations: limitSub(
          entry.residueAnnotations?.map(summarizeResidueAnnotation)
        ),
        allStructures: summarizeAllStructures(entry.allStructures)
      })),
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

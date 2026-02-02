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
   NORMALIZATION
---------------------------------- */
function normalizeObjectToArray(input: any): any[] {
  if (!input || typeof input !== "object") return [];
  return Object.values(input);
}

/* ---------------------------------
   SUMMARIZERS
---------------------------------- */
function summarizeSegment(seg: any) {
  return {
    start: seg.start,
    stop: seg.stop,
    path: limitSub(seg.path)
  };
}

function summarizeHelix(h: any) {
  return {
    start: h.start,
    stop: h.stop,
    path: limitSub(h.path),
    majorAxis: h.majoraxis,
    minorAxis: h.minoraxis
  };
}

function summarizeTopology(topology: any) {
  return {
    strands: limitSub(topology.strands?.map(summarizeSegment)),
    coils: limitSub(topology.coils?.map(summarizeSegment)),
    helices: limitSub(topology.helices?.map(summarizeHelix)),
    terms: limitSub(
      topology.terms?.map((t: any) => ({
        type: t.type,
        resnum: t.resnum,
        start: t.start,
        stop: t.stop,
        path: limitSub(t.path)
      }))
    ),
    extents: limitSub(topology.extents)
  };
}

/* ---------------------------------
   HANDLER
---------------------------------- */
export class PDBeTopologyHandler {
  async run(args: {
    pdb_id: string;
    chain_id?: string;
    size?: number;
  }) {
    const size = normalizeSize(args.size);

    const url = args.chain_id
      ? `${BASE_URL}/topology/entry/${args.pdb_id}/chain/${args.chain_id}`
      : `${BASE_URL}/topology/entry/${args.pdb_id}`;

    const data = await fetchJson(url);

    /**
     * Response shape:
     * {
     *   pdb_id: {
     *     chain_id: {
     *       entity_id: topologyObject
     *     }
     *   }
     * }
     */

    const pdbLevel = data?.[args.pdb_id] ?? {};
    const chains = normalizeObjectToArray(pdbLevel);

    const result = limitSub(
      chains.flatMap((chainObj: any) =>
        normalizeObjectToArray(chainObj).map((entity: any) =>
          summarizeTopology(entity)
        )
      ),
      size
    );

    return {
      structuredContent: {
        action: "topology",
        pdb_id: args.pdb_id,
        chain_id: args.chain_id ?? null,
        count: result.length,
        data: result
      },
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              action: "topology",
              pdb_id: args.pdb_id,
              chain_id: args.chain_id ?? null,
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

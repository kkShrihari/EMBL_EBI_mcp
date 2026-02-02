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
  method: "GET" | "POST",
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
export class PDBeValidationHandler {
  async run(args: {
    action:
      | "RNA_pucker_suite_outliers_get"
      | "rama_sidechain_outliers_get"
      | "rama_sidechain_outliers_post"
      | "geometry_outlier_residues_get"
      | "rama_sidechain_listing_get"
      | "xray_refine_data_stats_get"
      | "model_quality_xray_get"
      | "summary_quality_scores_get"
      | "summary_quality_scores_post"
      | "residuewise_outlier_summary_get"
      | "residuewise_outlier_summary_post"
      | "global_percentiles_get"
      | "global_percentiles_post"
      | "key_validation_stats_get"
      | "key_validation_stats_post"
      | "vdw_clashes_get"
      | "vdw_clashes_post"
      | "outliers_all_get"
      | "outliers_all_post"
      | "nmr_cyrange_cores_get"
      | "nmr_cyrange_cores_post"
      | "nmr_ensemble_clustering_get"
      | "nmr_ensemble_clustering_post";
    pdb_id?: string;
    pdb_ids?: string[];
  }) {
    let url = "";
    let method: "GET" | "POST" = "GET";
    let body: any = undefined;

    switch (args.action) {
      case "RNA_pucker_suite_outliers_get":
        url = `${BASE_URL}/validation/RNA_pucker_suite_outliers/entry/${args.pdb_id}`;
        break;

      case "rama_sidechain_outliers_get":
        url = `${BASE_URL}/validation/protein-ramachandran-sidechain-outliers/entry/${args.pdb_id}`;
        break;

      case "rama_sidechain_outliers_post":
        method = "POST";
        url = `${BASE_URL}/validation/protein-ramachandran-sidechain-outliers/entry`;
        body = args.pdb_ids?.join(",");
        break;

      case "geometry_outlier_residues_get":
        url = `${BASE_URL}/validation/protein-RNA-DNA-geometry-outlier-residues/entry/${args.pdb_id}`;
        break;

      case "rama_sidechain_listing_get":
        url = `${BASE_URL}/validation/rama_sidechain_listing/entry/${args.pdb_id}`;
        break;

      case "xray_refine_data_stats_get":
        url = `${BASE_URL}/validation/xray_refine_data_stats/entry/${args.pdb_id}`;
        break;

      case "model_quality_xray_get":
        url = `${BASE_URL}/validation/model_quality_xray/entry/${args.pdb_id}`;
        break;

      case "summary_quality_scores_get":
        url = `${BASE_URL}/validation/summary_quality_scores/entry/${args.pdb_id}`;
        break;

      case "summary_quality_scores_post":
        method = "POST";
        url = `${BASE_URL}/validation/summary_quality_scores/entry`;
        body = args.pdb_ids?.join(",");
        break;

      case "residuewise_outlier_summary_get":
        url = `${BASE_URL}/validation/residuewise_outlier_summary/entry/${args.pdb_id}`;
        break;

      case "residuewise_outlier_summary_post":
        method = "POST";
        url = `${BASE_URL}/validation/residuewise_outlier_summary/entry`;
        body = args.pdb_ids?.join(",");
        break;

      case "global_percentiles_get":
        url = `${BASE_URL}/validation/global-percentiles/entry/${args.pdb_id}`;
        break;

      case "global_percentiles_post":
        method = "POST";
        url = `${BASE_URL}/validation/global-percentiles/entry`;
        body = args.pdb_ids?.join(",");
        break;

      case "key_validation_stats_get":
        url = `${BASE_URL}/validation/key_validation_stats/entry/${args.pdb_id}`;
        break;

      case "key_validation_stats_post":
        method = "POST";
        url = `${BASE_URL}/validation/key_validation_stats/entry`;
        body = args.pdb_ids?.join(",");
        break;

      case "vdw_clashes_get":
        url = `${BASE_URL}/validation/vdw_clashes/entry/${args.pdb_id}`;
        break;

      case "vdw_clashes_post":
        method = "POST";
        url = `${BASE_URL}/validation/vdw_clashes/entry`;
        body = args.pdb_ids?.join(",");
        break;

      case "outliers_all_get":
        url = `${BASE_URL}/validation/outliers/all/${args.pdb_id}`;
        break;

      case "outliers_all_post":
        method = "POST";
        url = `${BASE_URL}/validation/outliers/all`;
        body = args.pdb_ids?.join(",");
        break;

      case "nmr_cyrange_cores_get":
        url = `${BASE_URL}/validation/nmr_cyrange_cores/entry/${args.pdb_id}`;
        break;

      case "nmr_cyrange_cores_post":
        method = "POST";
        url = `${BASE_URL}/validation/nmr_cyrange_cores/entry`;
        body = args.pdb_ids?.join(",");
        break;

      case "nmr_ensemble_clustering_get":
        url = `${BASE_URL}/validation/nmr_ensemble_clustering/entry/${args.pdb_id}`;
        break;

      case "nmr_ensemble_clustering_post":
        method = "POST";
        url = `${BASE_URL}/validation/nmr_ensemble_clustering/entry`;
        body = args.pdb_ids?.join(",");
        break;

      default:
        throw new Error("Unknown validation action");
    }

    const raw = await fetchJson(url, method, body);

    if (!raw || Object.keys(raw).length === 0) {
      return {
        content: [{ type: "text", text: "No meaningful data available" }]
      };
    }

    const residueHeavy = args.action.includes("outlier");

    const data = normalizeTop(raw)
      .map(({ id, payload }) => ({
        id,
        payload: clean(payload, 0, residueHeavy)
      }))
      .filter(x => x.payload !== null)
      .slice(0, TOP_LIMIT);

    return {
      structuredContent: {
        action: args.action,
        pdb_id: args.pdb_id ?? args.pdb_ids,
        data: data.length ? data : null
      },
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              action: args.action,
              pdb_id: args.pdb_id ?? args.pdb_ids,
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

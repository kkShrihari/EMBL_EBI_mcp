import { BASE, fetchJSON, clean } from "./_base.js";

export class ChebiCalcHandler {

  async run(args: { action: string; body?: any }) {

    /* ----- ALLOWED CALCULATION ENDPOINTS ----- */
    const allowed = new Set([
      "avg-mass",
      "avg-mass/from-formula",
      "mol-formula",
      "monoisotopic-mass",
      "monoisotopic-mass/from-formula",
      "net-charge",
      "depict-indigo"
    ]);

    if (!allowed.has(args.action)) {
      return {
        structuredContent: {
          action: args.action,
          error: "Unsupported calculation endpoint"
        },
        content: [{ type: "text", text: "Unsupported calculation endpoint" }]
      };
    }

    const url = `${BASE}/chebi/backend/api/public/structure-calculations/${args.action}/`;

    const raw = await fetchJSON(url, "POST", args.body);

    /* ---------- API ERROR ---------- */
    if ((raw as any)?.__error) {
      return {
        structuredContent: {
          action: args.action,
          error: raw
        },
        content: [{ type: "text", text: JSON.stringify(raw, null, 2) }]
      };
    }

    /* ---------- CLEAN ---------- */
    const cleaned = clean(raw);

    const response = {
      action: args.action,
      data: cleaned ? [{ id: "calc", payload: cleaned }] : []
    };

    return {
      structuredContent: response,
      content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
    };
  }
}

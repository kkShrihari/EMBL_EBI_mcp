import { BASE, fetchJSON, clean } from "./_base.js";

export class ChebiCompoundHandler {
  async run(args: { action: "compound" | "structure" | "molfile"; id: string }) {

    let url = "";

    switch (args.action) {
      case "compound":
        url = `${BASE}/chebi/backend/api/public/compound/${args.id}/`;
        break;

      case "structure":
        url = `${BASE}/chebi/backend/api/public/structure/${args.id}/`;
        break;

      case "molfile":
        url = `${BASE}/chebi/backend/api/public/molfile/${args.id}/`;
        break;

      default:
        return {
          structuredContent: {
            action: args.action,
            error: "Unknown compound action"
          },
          content: [{ type: "text", text: "Unknown compound action" }]
        };
    }

    const raw = await fetchJSON(url, "GET");

    /* ---------- API ERROR HANDLING ---------- */
    if ((raw as any)?.__error) {
      return {
        structuredContent: {
          action: args.action,
          id: args.id,
          error: raw
        },
        content: [{ type: "text", text: JSON.stringify(raw, null, 2) }]
      };
    }

    /* ---------- CLEAN DATA ---------- */
    const cleaned = clean(raw);

    const response = {
      action: args.action,
      id: args.id,
      data: cleaned ? [{ id: args.id, payload: cleaned }] : []
    };

    return {
      structuredContent: response,
      content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
    };
  }
}

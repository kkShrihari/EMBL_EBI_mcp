import { BASE, fetchJSON, clean } from "./_base.js";

export class ChebiOntologyHandler {
  async run(args: { action: "children" | "parents" | "path"; id: string; body?: any }) {

    let url = "";
    let method: "GET" | "POST" = "GET";

    switch (args.action) {

      case "children":
        url = `${BASE}/chebi/backend/api/public/ontology/children/${args.id}/`;
        break;

      case "parents":
        url = `${BASE}/chebi/backend/api/public/ontology/parents/${args.id}/`;
        break;

      case "path":
        url = `${BASE}/chebi/backend/api/public/ontology/all_children_in_path/`;
        method = "POST";
        break;

      default:
        return {
          structuredContent: {
            action: args.action,
            error: "Unknown ontology action"
          },
          content: [{ type: "text", text: "Unknown ontology action" }]
        };
    }

    const raw = await fetchJSON(url, method, args.body);

    /* ---------- API ERROR ---------- */
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

    /* ---------- CLEAN ---------- */
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

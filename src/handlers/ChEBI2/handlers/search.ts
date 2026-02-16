import { BASE, fetchJSON, clean } from "./_base.js";

export class ChebiSearchHandler {

  async run(args: {
    action: "advanced" | "es" | "compounds" | "structure" | "sources";
    query?: string;
    body?: any;
  }) {

    let url = "";
    let method: "GET" | "POST" = "GET";

    switch (args.action) {

      case "advanced":
        url = `${BASE}/chebi/backend/api/public/advanced_search/`;
        method = "POST";
        break;

      case "es":
        if (!args.query) {
          return {
            structuredContent: { action: args.action, error: "query required" },
            content: [{ type: "text", text: "query required" }]
          };
        }
        // IMPORTANT: ChEBI uses ?query= not ?q=
        url = `${BASE}/chebi/backend/api/public/es_search/?query=${encodeURIComponent(args.query)}`;
        break;

      case "compounds":
        url = `${BASE}/chebi/backend/api/public/compounds/`;
        method = args.body ? "POST" : "GET";
        break;

      case "structure":
        url = `${BASE}/chebi/backend/api/public/structure_search/`;
        method = args.body ? "POST" : "GET";
        break;

      case "sources":
        url = `${BASE}/chebi/backend/api/public/advanced_search/sources_list`;
        break;

      default:
        return {
          structuredContent: { action: args.action, error: "Unknown search action" },
          content: [{ type: "text", text: "Unknown search action" }]
        };
    }

    const raw = await fetchJSON(url, method, args.body);

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
      data: cleaned ? [{ id: "search", payload: cleaned }] : []
    };

    return {
      structuredContent: response,
      content: [{ type: "text", text: JSON.stringify(response, null, 2) }]
    };
  }
}

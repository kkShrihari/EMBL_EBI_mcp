import fetch from "node-fetch";

const BASE_URL = "https://www.ebi.ac.uk/QuickGO/services";

/* --------------------------------- LIMITS -------------------------------- */
const NESTED_LIMIT = 5;

/* --------------------------------- FETCH -------------------------------- */
async function fetchSmart(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  if (res.status === 404) return { __not_found: true };
  if (!res.ok) throw new Error(`Annotation extension failed (${res.status})`);

  return res.json();
}

/* --------------------------------- CLEAN -------------------------------- */
function clean(value: any, depth = 0): any {
  if (Array.isArray(value)) {
    return value
      .map(v => clean(v, depth + 1))
      .filter(v => v !== null)
      .slice(0, NESTED_LIMIT);
  }

  if (value && typeof value === "object") {
    const obj: any = {};
    for (const [k, v] of Object.entries(value)) {
      const c = clean(v, depth + 1);
      if (c !== null) obj[k] = c;
    }
    return Object.keys(obj).length ? obj : null;
  }

  if (value === "" || value === undefined) return null;
  return value;
}

/* --------------------------------- HANDLER -------------------------------- */
export class AnnotationExtensionHandler {
  async run(args: {
    action: "relations" | "relationsDomain" | "validate";
    goId?: string;
    candidate?: string;
  }) {
    let url = "";

    switch (args.action) {
      case "relations":
        url = `${BASE_URL}/ontology/ae/relations`;
        break;

      case "relationsDomain":
        if (!args.goId) throw new Error("goId required");
        url = `${BASE_URL}/ontology/ae/relations/${encodeURIComponent(args.goId)}`;
        break;

      case "validate":
        if (!args.goId || !args.candidate)
          throw new Error("goId and candidate required");
        url = `${BASE_URL}/ontology/ae/${encodeURIComponent(args.goId)}/validate/${encodeURIComponent(args.candidate)}`;
        break;

      default:
        throw new Error("Unknown annotation_ext action");
    }

    const raw = await fetchSmart(url);

    if (raw && (raw as any).__not_found) {
      const notFound = { action: args.action, data: [] };
      return {
        structuredContent: notFound,
        content: [{ type: "text", text: JSON.stringify(notFound, null, 2) }],
      };
    }

    const cleaned = clean(raw, 0);

    const response = {
      action: args.action,
      goId: args.goId ?? null,
      candidate: args.candidate ?? null,
      data: cleaned ? [{ id: args.goId ?? "root", payload: cleaned }] : [],
    };

    return {
      structuredContent: response,
      content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
    };
  }
}

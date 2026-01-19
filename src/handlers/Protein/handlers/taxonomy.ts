import fetch from "node-fetch";

const BASE_URL = "https://rest.uniprot.org";

/**
 * UniProt Taxonomy handler
 *
 * Covers:
 *
 * - GET /taxonomy/ancestor/{ids}
 * - GET /taxonomy/id/{id}
 * - GET /taxonomy/id/{id}/children
 * - GET /taxonomy/id/{id}/children/node
 * - GET /taxonomy/id/{id}/node
 * - GET /taxonomy/id/{id}/parent
 * - GET /taxonomy/id/{id}/parent/node
 * - GET /taxonomy/id/{id}/siblings
 * - GET /taxonomy/id/{id}/siblings/node
 * - GET /taxonomy/ids/{ids}
 * - GET /taxonomy/ids/{ids}/node
 * - GET /taxonomy/lineage/{id}
 * - GET /taxonomy/name/{name}
 * - GET /taxonomy/name/{name}/node
 * - GET /taxonomy/path
 * - GET /taxonomy/path/nodes
 * - GET /taxonomy/relationship
 */
export class ProteinTaxonomyHandler {
  async run(args: {
    action:
      | "ancestor"
      | "by_id"
      | "children"
      | "children_node"
      | "node"
      | "parent"
      | "parent_node"
      | "siblings"
      | "siblings_node"
      | "by_ids"
      | "by_ids_node"
      | "lineage"
      | "by_name"
      | "by_name_node"
      | "path"
      | "path_nodes"
      | "relationship";
    id?: string;
    ids?: string;
    name?: string;
    from?: string;
    to?: string;
    direction?: "TOP" | "BOTTOM";
    depth?: number;
    size?: number;
  }) {
    const {
      action,
      id,
      ids,
      name,
      from,
      to,
      direction,
      depth,
      size
    } = args;

    let url: string;

    // ----------------------------------------
    // ROUTING
    // ----------------------------------------
    switch (action) {
      case "ancestor": {
        if (!ids) {
          throw new Error("ids is required for ancestor");
        }
        url = `${BASE_URL}/taxonomy/ancestor/${encodeURIComponent(ids)}`;
        break;
      }

      case "by_id": {
        if (!id) {
          throw new Error("id is required");
        }
        url = `${BASE_URL}/taxonomy/id/${encodeURIComponent(id)}`;
        break;
      }

      case "children": {
        if (!id) {
          throw new Error("id is required for children");
        }
        url = `${BASE_URL}/taxonomy/id/${encodeURIComponent(id)}/children`;
        break;
      }

      case "children_node": {
        if (!id) {
          throw new Error("id is required for children_node");
        }
        url = `${BASE_URL}/taxonomy/id/${encodeURIComponent(
          id
        )}/children/node`;
        break;
      }

      case "node": {
        if (!id) {
          throw new Error("id is required for node");
        }
        url = `${BASE_URL}/taxonomy/id/${encodeURIComponent(id)}/node`;
        break;
      }

      case "parent": {
        if (!id) {
          throw new Error("id is required for parent");
        }
        url = `${BASE_URL}/taxonomy/id/${encodeURIComponent(id)}/parent`;
        break;
      }

      case "parent_node": {
        if (!id) {
          throw new Error("id is required for parent_node");
        }
        url = `${BASE_URL}/taxonomy/id/${encodeURIComponent(
          id
        )}/parent/node`;
        break;
      }

      case "siblings": {
        if (!id) {
          throw new Error("id is required for siblings");
        }
        url = `${BASE_URL}/taxonomy/id/${encodeURIComponent(id)}/siblings`;
        break;
      }

      case "siblings_node": {
        if (!id) {
          throw new Error("id is required for siblings_node");
        }
        url = `${BASE_URL}/taxonomy/id/${encodeURIComponent(
          id
        )}/siblings/node`;
        break;
      }

      case "by_ids": {
        if (!ids) {
          throw new Error("ids is required");
        }
        url = `${BASE_URL}/taxonomy/ids/${encodeURIComponent(ids)}`;
        break;
      }

      case "by_ids_node": {
        if (!ids) {
          throw new Error("ids is required for by_ids_node");
        }
        url = `${BASE_URL}/taxonomy/ids/${encodeURIComponent(ids)}/node`;
        break;
      }

      case "lineage": {
        if (!id) {
          throw new Error("id is required for lineage");
        }
        url = `${BASE_URL}/taxonomy/lineage/${encodeURIComponent(id)}`;
        break;
      }

      case "by_name": {
        if (!name) {
          throw new Error("name is required");
        }
        url = `${BASE_URL}/taxonomy/name/${encodeURIComponent(name)}`;
        break;
      }

      case "by_name_node": {
        if (!name) {
          throw new Error("name is required for by_name_node");
        }
        url = `${BASE_URL}/taxonomy/name/${encodeURIComponent(
          name
        )}/node`;
        break;
      }

      case "path": {
        if (!from || !to) {
          throw new Error("from and to are required for path");
        }

        const params = new URLSearchParams({
          from,
          to,
          ...(direction ? { direction } : {}),
          ...(depth ? { depth: String(depth) } : {})
        });

        url = `${BASE_URL}/taxonomy/path?${params.toString()}`;
        break;
      }

      case "path_nodes": {
        if (!from || !to) {
          throw new Error("from and to are required for path_nodes");
        }

        const params = new URLSearchParams({
          from,
          to,
          ...(direction ? { direction } : {}),
          ...(depth ? { depth: String(depth) } : {}),
          size: String(size ?? 25)
        });

        url = `${BASE_URL}/taxonomy/path/nodes?${params.toString()}`;
        break;
      }

      case "relationship": {
        if (!from || !to) {
          throw new Error("from and to are required for relationship");
        }

        const params = new URLSearchParams({ from, to });
        url = `${BASE_URL}/taxonomy/relationship?${params.toString()}`;
        break;
      }

      default:
        throw new Error(`Unknown taxonomy action: ${action}`);
    }

    // ----------------------------------------
    // FETCH
    // ----------------------------------------
    const res = await fetch(url, {
      headers: { Accept: "application/json" }
    });

    if (!res.ok) {
      throw new Error(
        `UniProt Taxonomy API failed (${res.status})`
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(
        "UniProt Taxonomy API returned non-JSON response: " +
          text.slice(0, 200)
      );
    }

    const data: any = await res.json();

    // ----------------------------------------
    // EMPTY RESULT
    // ----------------------------------------
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return {
        structuredContent: {
          action,
          id,
          ids,
          name,
          from,
          to,
          count: 0
        }
      };
    }

    // ----------------------------------------
    // PAYLOAD
    // ----------------------------------------
    const payload = {
      action,
      id,
      ids,
      name,
      from,
      to,
      data
    };

    // ----------------------------------------
    // MCP RESPONSE
    // ----------------------------------------
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(payload, null, 2) + "\n"
        }
      ],
      structuredContent: payload
    };
  }
}

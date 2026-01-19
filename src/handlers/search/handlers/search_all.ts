import fetch from "node-fetch";

/**
 * Remove zero-hit branches recursively
 */
function removeZeroHits(node: any): any | null {
  if (node.hitCount === 0) return null;

  if (Array.isArray(node.subdomains)) {
    node.subdomains = node.subdomains
      .map(removeZeroHits)
      .filter(Boolean);
  }

  return node;
}

/**
 * Limit hierarchy depth
 */
function pruneTree(node: any, depth: number): any {
  if (depth <= 0 || !Array.isArray(node.subdomains)) {
    const { subdomains, ...rest } = node;
    return rest;
  }

  return {
    ...node,
    subdomains: node.subdomains.map((s: any) =>
      pruneTree(s, depth - 1)
    )
  };
}

/**
 * Flatten hierarchy into id + hitCount list
 */
function flattenTree(
  node: any,
  out: { id: string; hitCount: number }[] = []
) {
  out.push({ id: node.id, hitCount: node.hitCount });

  if (Array.isArray(node.subdomains)) {
    for (const s of node.subdomains) {
      flattenTree(s, out);
    }
  }

  return out;
}

export class EBISearchAllHandler {
  async run(args: {
    query: string;
    size?: number;
    start?: number;
    includeHierarchy?: boolean;
    maxDepth?: number; // override in tests if needed
  }) {
    const {
      query,
      size = 10,
      start = 0,
      includeHierarchy = false,
      maxDepth = 2   // ✅ DEFAULT DEPTH = 2
    } = args;

    if (!query) {
      throw new Error("query is required");
    }

    const params = new URLSearchParams({
      query,
      size: String(size),
      start: String(start),
      format: "json"
    });

    const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/allebi?${params.toString()}`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`EBI Search failed (${res.status})`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(
        "EBI Search returned non-JSON response: " + text.slice(0, 200)
      );
    }

    const data: any = await res.json();

    if (!Array.isArray(data.domains)) {
      throw new Error("Unexpected API response format: domains not found");
    }

    const rootDomain = data.domains[0];

    let processedSubdomains: any = undefined;

    if (includeHierarchy && rootDomain?.subdomains) {
      // 1️⃣ prune depth
      processedSubdomains = rootDomain.subdomains.map((s: any) =>
        pruneTree(s, maxDepth)
      );

      // 2️⃣ remove zero-hit nodes (DEFAULT behavior)
      processedSubdomains = processedSubdomains
        .map(removeZeroHits)
        .filter(Boolean);

      // 3️⃣ flatten hierarchy (DEFAULT behavior)
      processedSubdomains = processedSubdomains.flatMap((s: any) =>
        flattenTree(s)
      );
    }

    const payload = {
      query,
      hitCount: data.hitCount ?? null,
      domains: [
        {
          domain: rootDomain?.id ?? "allebi",
          hitCount: rootDomain?.hitCount ?? data.hitCount,
          ...(processedSubdomains
            ? { subdomains: processedSubdomains }
            : {})
        }
      ]
    };

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

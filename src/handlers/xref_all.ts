import fetch from "node-fetch";

export class EBICrossReferenceAllHandler {
  async run(args: {
    domain: string;
    entryId: string;
  }) {
    const { domain, entryId } = args;

    if (!domain || !entryId) {
      throw new Error("domain and entryId are required");
    }

    const params = new URLSearchParams({
      format: "json"
    });

    const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/${encodeURIComponent(
      domain
    )}/entry/${encodeURIComponent(entryId)}/xref?${params.toString()}`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(
        `EBI cross-reference discovery failed (${res.status})`
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(
        "EBI Search returned non-JSON response: " + text.slice(0, 200)
      );
    }

    const data: any = await res.json();

    let refs: any[] = [];

    if (Array.isArray(data.xref)) {
      refs = data.xref;
    } 
    else if (Array.isArray(data.entries)) {
      for (const e of data.entries) {
        refs.push(...(e.references ?? []));
      }
    }
    else if (Array.isArray(data.domains)) {
      for (const d of data.domains) {
        for (const e of (d.entries ?? [])) {
          refs.push({
            db: d.domain,
            id: e.id,
            fields: e.fields ?? {}
          });
        }
      }
    }
    else {
      throw new Error("Unexpected API response format");
    }

    // Normalize: group cross-references by target domain
    const payload = {
      sourceDomain: domain,
      sourceId: entryId,
      count: refs.length,
      crossReferences: refs.map((r: any) => ({
        targetDomain: String(r.db ?? r.source),
        entries: [
          {
            id: String(r.id),
            fields: r.fields ?? {}
          }
        ]
      }))
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

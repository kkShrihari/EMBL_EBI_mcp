import fetch from "node-fetch";

export class EBISummaryMultiReferenceHandler {
  async run(args: {
    references: string[];
  }) {
    const { references } = args;

    if (!Array.isArray(references) || references.length === 0) {
      throw new Error("references must be a non-empty array");
    }

    const params = new URLSearchParams();
    references.forEach(ref => {
      params.append("references", ref);
    });

    const url =
      `https://www.ebi.ac.uk/ebisearch/ws/rest/summary/api/multireference?` +
      params.toString();

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(
        `EBI summary multi-reference failed (${res.status})`
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(
        "EBI Summary API returned non-JSON response: " +
          text.slice(0, 200)
      );
    }

    const data: any = await res.json();

    if (!Array.isArray(data.links)) {
      throw new Error(
        "Unexpected API response format: links not found"
      );
    }

    const payload = {
      inputCount: references.length,
      links: data.links.map((l: any) => ({
        source: String(l.source),
        target: String(l.target),
        relation: l.relation ?? null
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

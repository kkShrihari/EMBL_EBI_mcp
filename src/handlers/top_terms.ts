import fetch from "node-fetch";

export class EBITopTermsHandler {
  async run(args: {
    domain: string;
    fieldId: string;
    size?: number;
  }) {
    const { domain, fieldId, size = 10 } = args;

    if (!domain || !fieldId) {
      throw new Error("domain and fieldId are required");
    }

    const params = new URLSearchParams({
      size: String(size),
      format: "json"
    });

    const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/${encodeURIComponent(
      domain
    )}/topterms/${encodeURIComponent(fieldId)}?${params.toString()}`;

    const res = await fetch(url);

    // graceful handling
    if (res.status === 400) {
      const payload = {
        domain,
        fieldId,
        terms: []
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

    if (!res.ok) {
      throw new Error(`EBI top terms query failed (${res.status})`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(
        "EBI Search returned non-JSON response: " + text.slice(0, 200)
      );
    }

    const data: any = await res.json();

    if (!Array.isArray(data.terms)) {
      throw new Error(
        "Unexpected API response format: terms not found"
      );
    }

    const payload = {
      domain,
      fieldId,
      terms: data.terms.map((t: any) => ({
        term: String(t.term),
        count: Number(t.count)
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

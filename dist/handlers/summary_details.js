import fetch from "node-fetch";
export class EBISummaryDetailsHandler {
    async run(args) {
        const { identifiers } = args;
        if (!Array.isArray(identifiers) || identifiers.length === 0) {
            throw new Error("identifiers must be a non-empty array");
        }
        const params = new URLSearchParams();
        identifiers.forEach(id => {
            params.append("identifiers", id);
        });
        const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/summary/api/details?` +
            params.toString();
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`EBI summary details failed (${res.status})`);
        }
        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
            const text = await res.text();
            throw new Error("EBI Summary API returned non-JSON response: " +
                text.slice(0, 200));
        }
        const data = await res.json();
        if (!Array.isArray(data.details)) {
            throw new Error("Unexpected API response format: details not found");
        }
        const payload = {
            count: data.details.length,
            summaries: data.details.map((d) => ({
                id: String(d.id),
                type: d.type ?? null,
                description: d.description ?? null,
                domains: d.domains ?? {}
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
//# sourceMappingURL=summary_details.js.map
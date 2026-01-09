import fetch from "node-fetch";
export class EBICrossReferenceDomainHandler {
    async run(args) {
        const { domain } = args;
        if (!domain) {
            throw new Error("domain is required");
        }
        const params = new URLSearchParams({
            format: "json"
        });
        const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/${encodeURIComponent(domain)}/xref?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`EBI domain cross-reference lookup failed (${res.status})`);
        }
        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
            const text = await res.text();
            throw new Error("EBI Search returned non-JSON response: " + text.slice(0, 200));
        }
        const data = await res.json();
        if (!Array.isArray(data.domains)) {
            throw new Error("Unexpected API response format: domains not found");
        }
        const payload = {
            sourceDomain: domain,
            targetDomains: data.domains.map((d) => ({
                domain: String(d.id),
                description: d.description ?? null
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
//# sourceMappingURL=xref_domain.js.map
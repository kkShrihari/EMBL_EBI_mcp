import fetch from "node-fetch";
import { URLSearchParams } from "url";
export class EBIAutocompleteHandler {
    async run(args) {
        const { domain, partial, size = 10 } = args;
        if (!domain || !partial) {
            throw new Error("domain and partial are required");
        }
        const params = new URLSearchParams({
            term: partial,
            size: String(size),
            format: "json"
        });
        const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/${encodeURIComponent(domain)}/autocomplete?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`EBI autocomplete failed (${res.status})`);
        }
        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
            const text = await res.text();
            throw new Error("EBI Search returned non-JSON response: " + text.slice(0, 200));
        }
        const data = await res.json();
        if (!Array.isArray(data.suggestions)) {
            throw new Error("Unexpected API response format: suggestions not found");
        }
        const payload = {
            domain,
            partial,
            suggestions: data.suggestions.map((s) => String(s))
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
//# sourceMappingURL=autocomplete.js.map
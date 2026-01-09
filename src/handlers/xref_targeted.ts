import fetch from "node-fetch";
import { EBICrossReferenceDomainHandler } from "./xref_domain.js";

const xrefDomainHandler = new EBICrossReferenceDomainHandler();

// Cache allowed targets per source domain
const allowedTargetsCache = new Map<string, Set<string>>();

export class EBICrossReferenceTargetedHandler {
  async run(args: {
    domain: string;
    entryIds: string | string[];
    targetDomain: string;
  }) {
    const { domain, entryIds, targetDomain } = args;

    // --------------------------------------------------
    // Basic validation
    // --------------------------------------------------
    if (!domain || !entryIds || !targetDomain) {
      throw new Error("domain, entryIds, and targetDomain are required");
    }

    // --------------------------------------------------
    // UniProt XREF requires ACCESSION, not entry name
    // --------------------------------------------------
    if (
      domain === "uniprot" &&
      typeof entryIds === "string" &&
      entryIds.includes("_")
    ) {
      throw new Error(
        "For UniProt XREF, use accession (e.g. P04637), not entry name (P53_HUMAN)"
      );
    }

    // --------------------------------------------------
    // 🔒 VALIDATE targetDomain via EBISearch discovery
    // --------------------------------------------------
    if (!allowedTargetsCache.has(domain)) {
      const res = await xrefDomainHandler.run({ domain });

      if (
        !res?.structuredContent?.targetDomains ||
        !Array.isArray(res.structuredContent.targetDomains)
      ) {
        throw new Error(
          `Failed to discover valid xref targets for domain '${domain}'`
        );
      }

      const targets = res.structuredContent.targetDomains.map(
        (t: any) => t.domain
      );

      allowedTargetsCache.set(domain, new Set(targets));
    }

    const allowedTargets = allowedTargetsCache.get(domain)!;

    if (!allowedTargets.has(targetDomain)) {
      throw new Error(
        `Unsupported EBISearch cross-reference: ${domain} → ${targetDomain}`
      );
    }

    // --------------------------------------------------
    // Build request
    // --------------------------------------------------
    const ids = Array.isArray(entryIds)
      ? entryIds.join(",")
      : entryIds;

    const params = new URLSearchParams({ format: "json" });

    const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/${encodeURIComponent(
      domain
    )}/entry/${encodeURIComponent(ids)}/xref/${encodeURIComponent(
      targetDomain
    )}?${params.toString()}`;

    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `EBI cross-reference search failed (${res.status}): ${text.slice(0, 200)}`
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

    if (!Array.isArray(data.entries)) {
      throw new Error(
        "Unexpected API response format: entries not found"
      );
    }

    // --------------------------------------------------
    // Preserve cross-reference structure
    // --------------------------------------------------
    const payload = {
      sourceDomain: domain,
      targetDomain,
      count: data.entries.length,
      crossReferences: data.entries.map((e: any) => ({
        sourceId: String(e.id),
        targets: (e.references ?? []).map((x: any) => ({
          id: String(x.id),
          domain: String(x.source)
        }))
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

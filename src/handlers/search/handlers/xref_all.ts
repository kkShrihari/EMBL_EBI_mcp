import fetch from "node-fetch";
import { EBICrossReferenceDomainHandler } from "./xref_domain.js";

// --------------------------------------------------
// LIMITS & PRIORITY (FINAL CONTRACT)
// --------------------------------------------------
const MAX_FETCH_DOMAINS = 10;
const MAX_RETURN_DOMAINS = 3;
const MAX_ENTRIES_PER_DOMAIN = 3;

const PRIORITY_DOMAINS = [
  "alphafold",
  "pdbe",
  "go"
];

export class EBICrossReferenceAllHandler {
  async run(args: { domain: string; entryId: string }) {
    const { domain, entryId } = args;

    if (!domain || !entryId) {
      throw new Error("domain and entryId are required");
    }

    // --------------------------------------------------
    // 1. Discover valid target domains
    // --------------------------------------------------
    const domainHandler = new EBICrossReferenceDomainHandler();
    const discovery = await domainHandler.run({ domain });

    const discoveredTargets =
      discovery?.structuredContent?.targetDomains?.map(
        (t: any) => t.domain
      ) ?? [];

    if (discoveredTargets.length === 0) {
      return {
        structuredContent: {
          sourceDomain: domain,
          sourceId: entryId
        }
      };
    }

    // --------------------------------------------------
    // 1a. Prioritize + limit FETCHED target domains (max 10)
    // --------------------------------------------------
    const prioritizedTargets = [
      ...PRIORITY_DOMAINS,
      ...discoveredTargets.filter(
        (d: unknown): d is string =>
          typeof d === "string" && PRIORITY_DOMAINS.indexOf(d) === -1
      )
    ];


    const targetsToFetch = prioritizedTargets.slice(0, MAX_FETCH_DOMAINS);

    // --------------------------------------------------
    // 2. Fan-out targeted xref calls (internally)
    // --------------------------------------------------
    const grouped = new Map<string, Set<string>>();

    for (const target of targetsToFetch) {
      const url = `https://www.ebi.ac.uk/ebisearch/ws/rest/${encodeURIComponent(
        domain
      )}/entry/${encodeURIComponent(
        entryId
      )}/xref/${encodeURIComponent(target)}?format=json`;

      try {
        const res = await fetch(url);
        if (!res.ok) continue;

        const data: any = await res.json();
        if (!Array.isArray(data.entries)) continue;

        for (const e of data.entries) {
          for (const r of e.references ?? []) {
            if (!grouped.has(target)) {
              grouped.set(target, new Set());
            }
            grouped.get(target)!.add(String(r.id));
          }
        }
      } catch {
        // ignore failed targets
      }
    }

    // --------------------------------------------------
    // 3. Build LIMITED + PRIORITIZED payload
    // --------------------------------------------------
    const allCrossRefs = Array.from(grouped.entries()).map(
      ([targetDomain, ids]) => ({
        targetDomain,
        entries: Array.from(ids)
          .slice(0, MAX_ENTRIES_PER_DOMAIN)
          .map(id => ({ id }))
      })
    );

    if (allCrossRefs.length === 0) {
      return {
        structuredContent: {
          sourceDomain: domain,
          sourceId: entryId
        }
      };
    }

    // sort by priority first, then by entry count
    allCrossRefs.sort((a, b) => {
      const pa = PRIORITY_DOMAINS.indexOf(a.targetDomain);
      const pb = PRIORITY_DOMAINS.indexOf(b.targetDomain);

      if (pa !== -1 || pb !== -1) {
        return (pa === -1 ? 999 : pa) - (pb === -1 ? 999 : pb);
      }

      return b.entries.length - a.entries.length;
    });

    // limit RETURNED domains to max 3
    const crossReferences = allCrossRefs.slice(0, MAX_RETURN_DOMAINS);

    const count = crossReferences.reduce(
      (sum, cr) => sum + cr.entries.length,
      0
    );

    // --------------------------------------------------
    // 4. Final response
    // --------------------------------------------------
    return {
      structuredContent: {
        sourceDomain: domain,
        sourceId: entryId,
        count,
        crossReferences
      }
    };
  }
}

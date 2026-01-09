export declare class EBICrossReferenceDomainHandler {
    run(args: {
        domain: string;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            sourceDomain: string;
            targetDomains: any;
        };
    }>;
}
//# sourceMappingURL=xref_domain.d.ts.map
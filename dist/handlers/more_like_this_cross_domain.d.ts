export declare class EBIMoreLikeThisCrossDomainHandler {
    run(args: {
        domain: string;
        entryId: string;
        targetDomain: string;
        size?: number;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            sourceDomain: string;
            sourceId: string;
            targetDomain: string;
            count: any;
            relatedEntries: any;
        };
    }>;
}
//# sourceMappingURL=more_like_this_cross_domain.d.ts.map
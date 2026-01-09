export declare class EBIMoreLikeThisSameDomainHandler {
    run(args: {
        domain: string;
        entryId: string;
        size?: number;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            domain: string;
            sourceId: string;
            count: any;
            similarEntries: any;
        };
    }>;
}
//# sourceMappingURL=more_like_this_same_domain.d.ts.map
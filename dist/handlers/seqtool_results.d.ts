export declare class EBISeqToolResultsSearchHandler {
    run(args: {
        query: string;
        size?: number;
        start?: number;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            query: string;
            hitCount: any;
            results: any;
        };
    }>;
}
//# sourceMappingURL=seqtool_results.d.ts.map
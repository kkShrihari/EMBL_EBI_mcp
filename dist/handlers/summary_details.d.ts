export declare class EBISummaryDetailsHandler {
    run(args: {
        identifiers: string[];
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            count: any;
            summaries: any;
        };
    }>;
}
//# sourceMappingURL=summary_details.d.ts.map
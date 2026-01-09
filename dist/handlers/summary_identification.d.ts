export declare class EBISummaryIdentificationHandler {
    run(args: {
        term: string;
        spine?: string;
        tid?: string;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            term: string;
            spineIds: any;
            identifications: any;
        };
    }>;
}
//# sourceMappingURL=summary_identification.d.ts.map
export declare class EBISummaryMultiReferenceHandler {
    run(args: {
        references: string[];
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            inputCount: number;
            links: any;
        };
    }>;
}
//# sourceMappingURL=summary_multireference.d.ts.map
export declare class EBISummarySuggestionsHandler {
    run(args: {
        term: string;
        size?: number;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            term: string;
            suggestions: any;
        };
    }>;
}
//# sourceMappingURL=summary_suggestions.d.ts.map
export declare class EBIAutocompleteHandler {
    run(args: {
        domain: string;
        partial: string;
        size?: number;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            domain: string;
            partial: string;
            suggestions: any;
        };
    }>;
}
//# sourceMappingURL=autocomplete.d.ts.map
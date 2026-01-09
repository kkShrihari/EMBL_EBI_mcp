export declare class EBITopTermsHandler {
    run(args: {
        domain: string;
        fieldId: string;
        size?: number;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            domain: string;
            fieldId: string;
            terms: any;
        };
    }>;
}
//# sourceMappingURL=top_terms.d.ts.map
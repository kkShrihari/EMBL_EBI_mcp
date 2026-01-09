export declare class EBICrossReferenceAllHandler {
    run(args: {
        domain: string;
        entryId: string;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            sourceDomain: string;
            sourceId: string;
            count: number;
            crossReferences: {
                targetDomain: string;
                entries: {
                    id: string;
                    fields: any;
                }[];
            }[];
        };
    }>;
}
//# sourceMappingURL=xref_all.d.ts.map
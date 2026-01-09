export declare class EBICrossReferenceTargetedHandler {
    run(args: {
        domain: string;
        entryIds: string | string[];
        targetDomain: string;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            sourceDomain: string;
            targetDomain: string;
            count: any;
            crossReferences: any;
        };
    }>;
}
//# sourceMappingURL=xref_targeted.d.ts.map
export declare class EBIGetEntryHandler {
    run(args: {
        domain: string;
        entryIds: string | string[];
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            domain: string;
            count: any;
            entries: any;
        };
    }>;
}
//# sourceMappingURL=get_entry.d.ts.map
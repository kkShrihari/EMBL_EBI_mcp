export declare class EBIGetRawDataHandler {
    run(args: {
        domain: string;
        entryId: string;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            domain: string;
            entryId: string;
            contentType: null;
            rawData: null;
            supported: boolean;
        };
    } | {
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            domain: string;
            entryId: string;
            contentType: string;
            rawData: string | object;
        };
    }>;
}
//# sourceMappingURL=get_raw_data.d.ts.map
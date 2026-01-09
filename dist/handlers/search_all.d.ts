export declare class EBISearchAllHandler {
    run(args: {
        query: string;
        size?: number;
        start?: number;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            query: string;
            hitCount: any;
            domains: any;
        };
    }>;
}
//# sourceMappingURL=search_all.d.ts.map
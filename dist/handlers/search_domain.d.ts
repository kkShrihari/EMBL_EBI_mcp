export declare class EBISearchDomainHandler {
    run(args: {
        domain: string;
        query: string;
        size?: number;
        start?: number;
    }): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        structuredContent: {
            domain: string;
            query: string;
            hitCount: any;
            entries: any;
        };
    }>;
}
//# sourceMappingURL=search_domain.d.ts.map
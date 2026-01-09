export interface EBIError {
    success: false;
    error: string;
}
export interface EBISuccess<T = any> {
    success: true;
    data: T;
}
export type EBIResponse<T = any> = EBISuccess<T> | EBIError;
export declare function search_all(params: {
    query: string;
    size?: number;
    start?: number;
}): Promise<EBIResponse>;
export declare function search_domain(params: {
    domain: string;
    query: string;
    size?: number;
}): Promise<EBIResponse>;
export declare function get_entry(params: {
    domain: string;
    entryIds: string | string[];
}): Promise<EBIResponse>;
export declare function xref_targeted(params: {
    domain: string;
    entryId: string;
    targetDomain: string;
}): Promise<EBIResponse>;
export declare function xref_all(params: {
    domain: string;
    entryId: string;
}): Promise<EBIResponse>;
export declare function xref_domain(params: {
    domain: string;
}): Promise<EBIResponse>;
export declare function autocomplete(params: {
    domain: string;
    partial: string;
    size?: number;
}): Promise<EBIResponse>;
export declare function top_terms(params: {
    domain: string;
    fieldId: string;
    size?: number;
}): Promise<EBIResponse>;
export declare function seqtool_results(params: {
    domain: string;
    query: string;
}): Promise<EBIResponse>;
export declare function more_like_this_same_domain(params: {
    domain: string;
    entryId: string;
}): Promise<EBIResponse>;
export declare function more_like_this_cross_domain(params: {
    domain: string;
    entryId: string;
    targetDomain: string;
}): Promise<EBIResponse>;
export declare function get_raw_data(params: {
    domain: string;
    entryId: string;
}): Promise<EBIResponse>;
export declare function summary_suggestions(params: {
    term: string;
}): Promise<EBIResponse>;
export declare function summary_identification(params: {
    identifiers: string[];
}): Promise<EBIResponse>;
export declare function summary_multireference(params: {
    references: string[];
}): Promise<EBIResponse>;
export declare function summary_details(params: {
    identifiers: string[];
}): Promise<EBIResponse>;
//# sourceMappingURL=utils.d.ts.map
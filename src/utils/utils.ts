//-------------------------------------------------------------
// FORCE IPv4 DNS
//-------------------------------------------------------------
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

//-------------------------------------------------------------
// FETCH (node-fetch v3, ESM)
//-------------------------------------------------------------
import fetch from "node-fetch";

//-------------------------------------------------------------
// TYPES
//-------------------------------------------------------------
export interface EBIError {
  success: false;
  error: string;
}

export interface EBISuccess<T = any> {
  success: true;
  data: T;
}

export type EBIResponse<T = any> = EBISuccess<T> | EBIError;

//-------------------------------------------------------------
// ERROR WRAPPER
//-------------------------------------------------------------
function err(msg: string): EBIError {
  return { success: false, error: msg };
}

//-------------------------------------------------------------
// INTERNAL JSON FETCH
//-------------------------------------------------------------
async function fetchJSON(url: string): Promise<any | EBIError> {
  try {
    const res = await fetch(url);
    const ct = res.headers.get("content-type") ?? "";

    if (!res.ok) return err(`HTTP ${res.status}`);
    if (!ct.includes("application/json")) {
      return err("Non-JSON response");
    }

    return await res.json();
  } catch (e: any) {
    return err(e?.message ?? "Fetch failed");
  }
}

//=============================================================
// 1. search_all
//=============================================================
export async function search_all(params: {
  query: string;
  size?: number;
  start?: number;
}): Promise<EBIResponse> {

  const q = new URLSearchParams();
  q.set("query", params.query);
  q.set("format", "json");
  if (params.size) q.set("size", String(params.size));
  if (params.start) q.set("start", String(params.start));

  const data = await fetchJSON(
    "https://www.ebi.ac.uk/ebisearch/ws/rest/?" + q.toString()
  );
  return wrap(data);
}

//=============================================================
// 2. search_domain
//=============================================================
export async function search_domain(params: {
  domain: string;
  query: string;
  size?: number;
}): Promise<EBIResponse> {

  const q = new URLSearchParams();
  q.set("query", params.query);
  q.set("format", "json");
  if (params.size) q.set("size", String(params.size));

  const data = await fetchJSON(
    `https://www.ebi.ac.uk/ebisearch/ws/rest/${params.domain}?` +
      q.toString()
  );
  return wrap(data);
}

//=============================================================
// 3. get_entry
//=============================================================
export async function get_entry(params: {
  domain: string;
  entryIds: string | string[];
}): Promise<EBIResponse> {

  const ids = Array.isArray(params.entryIds)
    ? params.entryIds.join(",")
    : params.entryIds;

  const data = await fetchJSON(
    `https://www.ebi.ac.uk/ebisearch/ws/rest/${params.domain}/entry/${ids}?format=json`
  );
  return wrap(data);
}

//=============================================================
// 4. xref_targeted
//=============================================================
export async function xref_targeted(params: {
  domain: string;
  entryId: string;
  targetDomain: string;
}): Promise<EBIResponse> {

  const data = await fetchJSON(
    `https://www.ebi.ac.uk/ebisearch/ws/rest/${params.domain}/entry/${params.entryId}/xref/${params.targetDomain}?format=json`
  );
  return wrap(data);
}

//=============================================================
// 5. xref_all
//=============================================================
export async function xref_all(params: {
  domain: string;
  entryId: string;
}): Promise<EBIResponse> {

  const data = await fetchJSON(
    `https://www.ebi.ac.uk/ebisearch/ws/rest/${params.domain}/entry/${params.entryId}/xref?format=json`
  );
  return wrap(data);
}

//=============================================================
// 6. xref_domain
//=============================================================
export async function xref_domain(params: {
  domain: string;
}): Promise<EBIResponse> {

  const data = await fetchJSON(
    `https://www.ebi.ac.uk/ebisearch/ws/rest/${params.domain}/xref?format=json`
  );
  return wrap(data);
}

//=============================================================
// 7. autocomplete
//=============================================================
export async function autocomplete(params: {
  domain: string;
  partial: string;
  size?: number;
}): Promise<EBIResponse> {

  const q = new URLSearchParams();
  q.set("term", params.partial);
  q.set("format", "json");
  if (params.size) q.set("size", String(params.size));

  const data = await fetchJSON(
    `https://www.ebi.ac.uk/ebisearch/ws/rest/${params.domain}/autocomplete?` +
      q.toString()
  );
  return wrap(data);
}

//=============================================================
// 8. top_terms
//=============================================================
export async function top_terms(params: {
  domain: string;
  fieldId: string;
  size?: number;
}): Promise<EBIResponse> {

  const q = new URLSearchParams();
  q.set("format", "json");
  if (params.size) q.set("size", String(params.size));

  const data = await fetchJSON(
    `https://www.ebi.ac.uk/ebisearch/ws/rest/${params.domain}/topterms/${params.fieldId}?` +
      q.toString()
  );
  return wrap(data);
}

//=============================================================
// 9. seqtool_results
//=============================================================
export async function seqtool_results(params: {
  domain: string;
  query: string;
}): Promise<EBIResponse> {

  const q = new URLSearchParams();
  q.set("query", params.query);
  q.set("format", "json");

  const data = await fetchJSON(
    `https://www.ebi.ac.uk/ebisearch/ws/rest/${params.domain}/seqtoolresults?` +
      q.toString()
  );
  return wrap(data);
}

//=============================================================
// 10. more_like_this_same_domain
//=============================================================
export async function more_like_this_same_domain(params: {
  domain: string;
  entryId: string;
}): Promise<EBIResponse> {

  const data = await fetchJSON(
    `https://www.ebi.ac.uk/ebisearch/ws/rest/${params.domain}/entry/${params.entryId}/morelikethis?format=json`
  );
  return wrap(data);
}

//=============================================================
// 11. more_like_this_cross_domain
//=============================================================
export async function more_like_this_cross_domain(params: {
  domain: string;
  entryId: string;
  targetDomain: string;
}): Promise<EBIResponse> {

  const data = await fetchJSON(
    `https://www.ebi.ac.uk/ebisearch/ws/rest/${params.domain}/entry/${params.entryId}/morelikethis/${params.targetDomain}?format=json`
  );
  return wrap(data);
}

//=============================================================
// 12. get_raw_data
//=============================================================
export async function get_raw_data(params: {
  domain: string;
  entryId: string;
}): Promise<EBIResponse> {

  try {
    const res = await fetch(
      `https://www.ebi.ac.uk/ebisearch/ws/rest/${params.domain}/rawdata/${params.entryId}`
    );

    if (!res.ok) return err(`HTTP ${res.status}`);

    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("application/json")
      ? await res.json()
      : await res.text();

    return { success: true, data };
  } catch (e: any) {
    return err(e?.message ?? "Fetch failed");
  }
}

//=============================================================
// 13. summary_suggestions
//=============================================================
export async function summary_suggestions(params: {
  term: string;
}): Promise<EBIResponse> {

  const data = await fetchJSON(
    `https://www.ebi.ac.uk/ebisearch/ws/rest/summary/api/suggestion?term=${encodeURIComponent(
      params.term
    )}`
  );
  return wrap(data);
}

//=============================================================
// 14. summary_identification
//=============================================================
export async function summary_identification(params: {
  identifiers: string[];
}): Promise<EBIResponse> {

  const q = new URLSearchParams();
  params.identifiers.forEach(i => q.append("identifiers", i));

  const data = await fetchJSON(
    "https://www.ebi.ac.uk/ebisearch/ws/rest/summary/api/identification?" +
      q.toString()
  );
  return wrap(data);
}

//=============================================================
// 15. summary_multireference
//=============================================================
export async function summary_multireference(params: {
  references: string[];
}): Promise<EBIResponse> {

  const q = new URLSearchParams();
  params.references.forEach(r => q.append("references", r));

  const data = await fetchJSON(
    "https://www.ebi.ac.uk/ebisearch/ws/rest/summary/api/multireference?" +
      q.toString()
  );
  return wrap(data);
}

//=============================================================
// 16. summary_details
//=============================================================
export async function summary_details(params: {
  identifiers: string[];
}): Promise<EBIResponse> {

  const q = new URLSearchParams();
  params.identifiers.forEach(i => q.append("identifiers", i));

  const data = await fetchJSON(
    "https://www.ebi.ac.uk/ebisearch/ws/rest/summary/api/details?" +
      q.toString()
  );
  return wrap(data);
}

//-------------------------------------------------------------
// WRAP HELPER
//-------------------------------------------------------------
function wrap(data: any | EBIError): EBIResponse {
  if ((data as EBIError)?.success === false) return data as EBIError;
  return { success: true, data };
}

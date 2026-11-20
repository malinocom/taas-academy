export declare function apiFetch<T = any>(path: string, init?: Omit<RequestInit, "body"> & { body?: any }): Promise<T>;
export declare function apiUrl(): any;

export declare function useReveal<T extends HTMLElement>(opts?: IntersectionObserverInit): {
    ref: import("react").MutableRefObject<T>;
    shown: boolean;
};

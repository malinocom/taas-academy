declare module "katex/contrib/auto-render" {
  type Delimiter = { left: string; right: string; display: boolean };
  export type AutoRenderOptions = {
    delimiters?: Delimiter[];
    throwOnError?: boolean;
    strict?: any;
  };

  export default function renderMathInElement(el: HTMLElement, options?: AutoRenderOptions): void;
}

declare module "katex/contrib/mhchem";

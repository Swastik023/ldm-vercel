// Minimal ambient shim for mermaid — used when tsconfig moduleResolution
// cannot follow the package 'exports' condition during Next.js type-check.
declare module 'mermaid' {
    interface MermaidConfig {
        startOnLoad?: boolean;
        theme?: string;
        themeVariables?: Record<string, string>;
        [key: string]: unknown;
    }

    interface RenderResult {
        svg: string;
        bindFunctions?: (el: Element) => void;
    }

    interface MermaidStatic {
        initialize(config: MermaidConfig): void;
        render(id: string, text: string): Promise<RenderResult>;
    }

    const mermaid: MermaidStatic;
    export default mermaid;
}

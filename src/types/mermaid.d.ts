// Type shim for mermaid — the package ships its own types but the project's
// tsconfig moduleResolution doesn't follow the 'exports' condition.
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

    interface MermaidAPI {
        initialize(config: MermaidConfig): void;
        render(id: string, text: string): Promise<RenderResult>;
    }

    const mermaid: MermaidAPI & {
        default: MermaidAPI;
        initialize: MermaidAPI['initialize'];
        render: MermaidAPI['render'];
    };

    export = mermaid;
    export default mermaid;
}

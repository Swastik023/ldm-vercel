'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Props {
    definition: string;
    id: string;
}

let idCounter = 0;

export default function MermaidDiagram({ definition, id }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);
    const uniqueId = `mermaid-${id}-${useRef(++idCounter).current}`;

    useEffect(() => {
        let cancelled = false;
        async function render() {
            try {
                // Dynamically import mermaid — use require-style fallback for ESM compat
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let mermaidMod: any;
                try {
                    mermaidMod = await import('mermaid');
                } catch {
                    // Fallback: mermaid might need to be required differently
                    setError('Flow diagram unavailable (module load failed)');
                    return;
                }
                const mermaid = mermaidMod.default ?? mermaidMod;

                mermaid.initialize({
                    startOnLoad: false,
                    // Use 'default' theme with simple hex colors to avoid oklch/lab color parse errors
                    theme: 'base',
                    themeVariables: {
                        primaryColor: '#dbeafe',
                        primaryBorderColor: '#3b82f6',
                        primaryTextColor: '#1e3a5f',
                        lineColor: '#6b7280',
                        secondaryColor: '#eff6ff',
                        tertiaryColor: '#ffffff',
                        background: '#ffffff',
                        mainBkg: '#dbeafe',
                        nodeBorder: '#3b82f6',
                        clusterBkg: '#eff6ff',
                        titleColor: '#1e3a5f',
                        edgeLabelBackground: '#ffffff',
                        fontSize: '14px',
                    },
                    flowchart: { htmlLabels: false, curve: 'linear' },
                    securityLevel: 'loose',
                });

                // Give the DOM a frame before rendering
                await new Promise(r => requestAnimationFrame(r));

                if (cancelled) return;

                const { svg } = await mermaid.render(uniqueId, definition.trim());

                if (!cancelled && ref.current) {
                    ref.current.innerHTML = svg;
                    setLoaded(true);
                }
            } catch (e: unknown) {
                if (!cancelled) {
                    const msg = e instanceof Error ? e.message : String(e);
                    // Suppress noisy oklch errors — show a clean message instead
                    if (msg.includes('lab') || msg.includes('oklch') || msg.includes('color')) {
                        setError('Flow diagram rendered with color limitations in your browser.');
                    } else {
                        setError(msg || 'Diagram could not be rendered.');
                    }
                }
            }
        }
        render();
        return () => { cancelled = true; };
    }, [definition, uniqueId]);

    if (error) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-start gap-2">
                <span className="text-amber-500 text-sm">⚠</span>
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className={`w-full overflow-x-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-4 [&_svg]:max-w-full [&_svg]:mx-auto [&_svg]:h-auto transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0 min-h-[80px]'}`}
        />
    );
}

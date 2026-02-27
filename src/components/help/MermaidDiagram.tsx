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
    const uniqueId = `mermaid-${id}-${useRef(++idCounter).current}`;

    useEffect(() => {
        let cancelled = false;
        async function render() {
            try {
                const mermaid = (await import('mermaid')).default;
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'base',
                    themeVariables: {
                        primaryColor: '#e0ebff',
                        primaryBorderColor: '#3b72f6',
                        primaryTextColor: '#1e293b',
                        lineColor: '#6b7280',
                        secondaryColor: '#f1f5ff',
                        tertiaryColor: '#fff',
                        fontSize: '14px',
                    },
                });
                const { svg } = await mermaid.render(uniqueId, definition.trim());
                if (!cancelled && ref.current) {
                    ref.current.innerHTML = svg;
                }
            } catch (e: any) {
                if (!cancelled) setError(String(e?.message || e));
            }
        }
        render();
        return () => { cancelled = true; };
    }, [definition, uniqueId]);

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">
                ⚠ Diagram render error: {error}
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className="w-full overflow-x-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-4 [&_svg]:max-w-full [&_svg]:mx-auto [&_svg]:h-auto"
        />
    );
}

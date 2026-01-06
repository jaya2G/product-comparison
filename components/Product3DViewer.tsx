'use client';

import { useEffect, useRef } from 'react';
import '@google/model-viewer';

interface Product3DViewerProps {
    modelUrl: string;
    alt?: string;
    autoRotate?: boolean;
    cameraControls?: boolean;
}

export function Product3DViewer({
    modelUrl,
    alt = '3D model',
    autoRotate = true,
    cameraControls = true,
}: Product3DViewerProps) {
    const modelViewerRef = useRef<any>(null);

    useEffect(() => {
        // Model viewer is loaded via the custom element
    }, []);

    if (!modelUrl) {
        return (
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">No 3D model available</p>
            </div>
        );
    }

    return (
        <div className="aspect-square bg-black rounded-lg overflow-hidden">
            <model-viewer
                ref={modelViewerRef}
                src={modelUrl}
                alt={alt}
                auto-rotate={autoRotate}
                camera-controls={cameraControls}
                shadow-intensity="1"
                style={{
                    width: '100%',
                    height: '100%',
                }}
                loading="eager"
            >
                <div
                    slot="progress-bar"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                    }}
                >
                    Loading 3D model...
                </div>
            </model-viewer>
        </div>
    );
}

// TypeScript declaration for model-viewer custom element
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': any;
        }
    }
}

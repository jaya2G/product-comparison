'use client';

import { useState, useRef, MouseEvent, TouchEvent } from 'react';
import { Button } from './ui/button';
import { Maximize2, X } from 'lucide-react';

interface Product360ViewerProps {
    images: string[];
    alt?: string;
}

export function Product360Viewer({ images, alt = '360 view' }: Product360ViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: MouseEvent) => {
        setIsDragging(true);
        setStartX(e.clientX);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const diff = e.clientX - startX;
        const sensitivity = 5;

        if (Math.abs(diff) > sensitivity) {
            const direction = diff > 0 ? 1 : -1;
            setCurrentIndex((prev) => {
                let next = prev + direction;
                if (next < 0) next = images.length - 1;
                if (next >= images.length) next = 0;
                return next;
            });
            setStartX(e.clientX);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e: TouchEvent) => {
        setIsDragging(true);
        setStartX(e.touches[0].clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging) return;

        const diff = e.touches[0].clientX - startX;
        const sensitivity = 10;

        if (Math.abs(diff) > sensitivity) {
            const direction = diff > 0 ? 1 : -1;
            setCurrentIndex((prev) => {
                let next = prev + direction;
                if (next < 0) next = images.length - 1;
                if (next >= images.length) next = 0;
                return next;
            });
            setStartX(e.touches[0].clientX);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    if (images.length === 0) {
        return (
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">No 360 images available</p>
            </div>
        );
    }

    return (
        <>
            <div
                ref={containerRef}
                className="relative aspect-square bg-black rounded-lg overflow-hidden select-none cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <img
                    src={images[currentIndex]}
                    alt={`${alt} - frame ${currentIndex + 1}`}
                    className="w-full h-full object-contain"
                    draggable={false}
                />

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {currentIndex + 1} / {images.length}
                </div>

                <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-4 right-4"
                    onClick={() => setIsFullscreen(true)}
                >
                    <Maximize2 className="h-4 w-4" />
                </Button>

                <div className="absolute bottom-4 left-4 text-white text-sm bg-black/70 px-2 py-1 rounded">
                    ← Drag to rotate →
                </div>
            </div>

            {/* Fullscreen Modal */}
            {isFullscreen && (
                <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                    <div
                        className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <img
                            src={images[currentIndex]}
                            alt={`${alt} - frame ${currentIndex + 1}`}
                            className="max-w-full max-h-full object-contain"
                            draggable={false}
                        />

                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/20 text-white px-4 py-2 rounded-full">
                            {currentIndex + 1} / {images.length}
                        </div>

                        <Button
                            size="icon"
                            variant="secondary"
                            className="absolute top-4 right-4"
                            onClick={() => setIsFullscreen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        <div className="absolute bottom-8 left-8 text-white bg-white/20 px-3 py-2 rounded">
                            ← Drag to rotate →
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

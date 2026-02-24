"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const images = [
    { src: "/images/drilldown.png", alt: "Drilldown Function Demo" },
    { src: "/images/datatable.png", alt: "Reactive Data Tables Demo" },
    { src: "/images/map.png", alt: "Geospatial Mapping Demo" }
];

export default function ImageCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        }, 4000); // 4 seconds delay
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full max-w-5xl mx-auto h-[400px] sm:h-[500px] overflow-hidden rounded-2xl shadow-xl mt-12 bg-white border border-gray-100 group">
            {images.map((img, idx) => (
                <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                        }`}
                >
                    <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        className="object-cover"
                        priority={idx === 0}
                    />
                    {/* Subtle overlay gradient at bottom to read caption */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-6 left-8 right-8 text-white font-medium text-lg drop-shadow-md">
                        {img.alt}
                    </div>
                </div>
            ))}

            {/* Navigation Indicators */}
            <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-3 h-3 rounded-full transition-colors ${idx === currentIndex ? "bg-[#FFB81C]" : "bg-white/50 hover:bg-white"
                            }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

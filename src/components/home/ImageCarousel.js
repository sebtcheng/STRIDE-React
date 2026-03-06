"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
    { src: "/img/5.png", alt: "STRIDE promotes data-driven education initiatives." },
    { src: "/img/3.png", alt: "Empowering institutions through strategic dashboards." },
    { src: "/img/2.png", alt: "Building efficient deployment strategies for schools." }
];

export default function ImageCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        }, 5000); // 5 seconds delay
        return () => clearInterval(timer);
    }, []);

    const prevSlide = () => setCurrentIndex(prev => prev === 0 ? slides.length - 1 : prev - 1);
    const nextSlide = () => setCurrentIndex(prev => prev === slides.length - 1 ? 0 : prev + 1);

    return (
        <div className="relative w-full max-w-[1000px] mx-auto h-[350px] sm:h-[450px] overflow-hidden rounded-2xl shadow-2xl bg-white border border-gray-100 group mt-[-30px]">
            {slides.map((slide, idx) => (
                <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                        }`}
                >
                    <img
                        src={slide.src}
                        alt="Carousel Slide"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://placehold.co/1000x500/e0e0e0/ffffff?text=App+Screenshot' }}
                    />
                    {/* Dark gradient overlay for caption readability */}
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                    {/* Centered semi-transparent dark overlay for caption text */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4">
                        <div className="bg-black/50 backdrop-blur-sm text-white px-6 py-3 rounded-lg text-center max-w-2xl border border-white/10 shadow-lg">
                            <p className="text-base sm:text-lg font-medium">{slide.alt}</p>
                        </div>
                    </div>
                </div>
            ))}

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 shadow-md"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 shadow-md"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Navigation Indicators */}
            <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-3 h-3 rounded-full transition-all shadow-md ${idx === currentIndex ? "bg-[#FFB81C] w-6" : "bg-white/50 hover:bg-white"
                            }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

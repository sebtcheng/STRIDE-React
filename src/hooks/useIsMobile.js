"use client";

import { useState, useEffect } from "react";

export default function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Only run on the client side
        if (typeof window === "undefined") return;

        const checkMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // Check immediately on mount
        checkMobile();

        // Add event listener for window resizes
        window.addEventListener("resize", checkMobile);

        // Cleanup listener on unmount
        return () => window.removeEventListener("resize", checkMobile);
    }, [breakpoint]);

    return isMobile;
}

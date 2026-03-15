import { createContext, useContext, useEffect, useState } from "react";

type AccessibilityState = {
    highContrast: boolean;
    reducedMotion: boolean;
    fontSize: number;
    dyslexicFont: boolean;
    saturation: number;
    setHighContrast: (enabled: boolean) => void;
    setReducedMotion: (enabled: boolean) => void;
    setFontSize: (size: number) => void;
    setDyslexicFont: (enabled: boolean) => void;
    setSaturation: (level: number) => void;
    resetToDefaults: () => void;
};

const initialState: AccessibilityState = {
    highContrast: false,
    reducedMotion: false,
    fontSize: 100,
    dyslexicFont: false,
    saturation: 100,
    setHighContrast: () => null,
    setReducedMotion: () => null,
    setFontSize: () => null,
    setDyslexicFont: () => null,
    setSaturation: () => null,
    resetToDefaults: () => null,
};

const AccessibilityContext = createContext<AccessibilityState>(initialState);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
    const [highContrast, setHighContrast] = useState(() => {
        return localStorage.getItem("a11y-high-contrast") === "true";
    });
    const [reducedMotion, setReducedMotion] = useState(() => {
        return localStorage.getItem("a11y-reduced-motion") === "true";
    });
    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem("a11y-font-size");
        return saved ? parseInt(saved, 10) : 100;
    });
    const [dyslexicFont, setDyslexicFont] = useState(() => {
        return localStorage.getItem("a11y-dyslexic-font") === "true";
    });
    const [saturation, setSaturation] = useState(() => {
        const saved = localStorage.getItem("a11y-saturation");
        return saved ? parseInt(saved, 10) : 100;
    });

    useEffect(() => {
        const root = document.documentElement;

        // High Contrast
        if (highContrast) root.classList.add("high-contrast");
        else root.classList.remove("high-contrast");
        localStorage.setItem("a11y-high-contrast", String(highContrast));

        // Reduced Motion
        if (reducedMotion) root.classList.add("reduced-motion");
        else root.classList.remove("reduced-motion");
        localStorage.setItem("a11y-reduced-motion", String(reducedMotion));

        // Font Size
        root.style.setProperty("--font-scale", `${fontSize / 100}`);
        localStorage.setItem("a11y-font-size", String(fontSize));

        // Dyslexic Font
        if (dyslexicFont) root.classList.add("dyslexic-font");
        else root.classList.remove("dyslexic-font");
        localStorage.setItem("a11y-dyslexic-font", String(dyslexicFont));

        // Saturation
        root.style.setProperty("--saturation-factor", `${saturation / 100}`);
        localStorage.setItem("a11y-saturation", String(saturation));

    }, [highContrast, reducedMotion, fontSize, dyslexicFont, saturation]);

    const resetToDefaults = () => {
        setHighContrast(false);
        setReducedMotion(false);
        setFontSize(100);
        setDyslexicFont(false);
        setSaturation(100);
    };

    const value = {
        highContrast,
        reducedMotion,
        fontSize,
        dyslexicFont,
        saturation,
        setHighContrast,
        setReducedMotion,
        setFontSize,
        setDyslexicFont,
        setSaturation,
        resetToDefaults,
    };

    return (
        <AccessibilityContext.Provider value={value}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (context === undefined)
        throw new Error("useAccessibility must be used within an AccessibilityProvider");
    return context;
};

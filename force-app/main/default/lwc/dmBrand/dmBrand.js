import { loadStyle } from 'lightning/platformResourceLoader';
import FONTS from '@salesforce/resourceUrl/PH_Brand_Fonts';

// Iterable brand helpers shared by the Deal Health components.
// Fonts: Icona Serif and Sofia Pro where installed, else Spectral and Poppins from the PH_Brand_Fonts static resource.
let fontsPromise;

export function loadBrand(cmp) {
    if (!fontsPromise) {
        fontsPromise = loadStyle(cmp, FONTS + '/fonts.css').catch(() => {
            // Fonts are cosmetic. The fallback stacks still render if the resource cannot load.
            fontsPromise = undefined;
        });
    }
    return fontsPromise;
}

// Health category colors. Fill: pills and legends, always with Deep Sea text. Mark: chart bars and segments.
export const HEALTH_FILL = { good: '#96cfae', warn: '#ffbfaa', bad: '#ec515f', none: '#e5ded8' };
export const HEALTH_MARK = { good: '#399d89', warn: '#d39f8f', bad: '#ec515f', none: '#d0c8bf' };
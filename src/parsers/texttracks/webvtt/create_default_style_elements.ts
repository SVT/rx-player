import { IStyleElement } from "./html/parse_style_block";

/**
 * Creates default classes defined in the W3 specification
 * 
 * https://www.w3.org/TR/webvtt1/#default-classes
 */

const colorMap: { [colorName: string]: string } = {
    "white": "#ffffff",
    "lime": "#00ff00",
    "cyan": "#00ffff",
    "red": "#ff0000",
    "yellow": "#ffff00",
    "magenta": "#ff00ff",
    "blue": "#0000ff",
    "black": "#000000"
};

export default function createDefaultStyleElements() { 
    return Object.keys(colorMap).reduce((result, key) => {
        result.push({
            className: key,
            isGlobalStyle: false,
            styleContent: `color: ${colorMap[key]}`
        });

        result.push({
            className: `bg_${key}`,
            isGlobalStyle: false,
            styleContent: `background-color: ${colorMap[key]}`
        });

        return result;
    }, [] as IStyleElement[]);
}
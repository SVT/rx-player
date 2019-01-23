/**
 * Copyright 2015 CANAL+ Group
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import objectAssign from "object-assign";
import getParentElementsByTagName from "../get_parent_elements_by_tag_name";
import { getStylingAttributes, } from "../get_styling";
import { REGXP_4_HEX_COLOR, REGXP_8_HEX_COLOR, REGXP_PERCENT_VALUES, } from "../regexps";
// Styling which can be applied to <span> from any level upper.
// Added here as an optimization
var SPAN_LEVEL_ATTRIBUTES = [
    "color",
    "direction",
    "display",
    "fontFamily",
    "fontSize",
    "fontStyle",
    "fontWeight",
    "textDecoration",
    "textOutline",
    "unicodeBidi",
    "visibility",
    "wrapOption",
];
/**
 * Translate a color indicated in TTML-style to a CSS-style color.
 * @param {string} color
 * @returns {string} color
 */
function ttmlColorToCSSColor(color) {
    // TODO check all possible color fomats
    var regRes;
    regRes = REGXP_8_HEX_COLOR.exec(color);
    if (regRes != null) {
        return "rgba(" +
            parseInt(regRes[1], 16) + "," +
            parseInt(regRes[2], 16) + "," +
            parseInt(regRes[3], 16) + "," +
            parseInt(regRes[4], 16) / 255 + ")";
    }
    regRes = REGXP_4_HEX_COLOR.exec(color);
    if (regRes != null) {
        return "rgba(" +
            parseInt(regRes[1] + regRes[1], 16) + "," +
            parseInt(regRes[2] + regRes[2], 16) + "," +
            parseInt(regRes[3] + regRes[3], 16) + "," +
            parseInt(regRes[4] + regRes[4], 16) / 255 + ")";
    }
    return color;
}
/**
 * Try to replicate the textOutline TTML style property into CSS.
 *
 * We mock it throught the text-shadow property, translating the TTML thickness
 * into blur radius and the blur-radius into... nothing.
 *
 * @param {string} color
 * @param {string|number} thickness
 * @returns {string}
 */
function generateCSSTextOutline(color, thickness) {
    return "-1px -1px " + thickness + " " + color + "," +
        ("1px -1px " + thickness + " " + color + ",") +
        ("-1px 1px " + thickness + " " + color + ",") +
        ("1px 1px " + thickness + " " + color);
}
// TODO
// tts:showBackground (applies to region)
// tts:zIndex (applies to region)
/**
 * Apply style set for a singular text span of the current cue.
 * @param {HTMLElement} element - The text span
 * @param {Object} style - The style to apply
 */
function applyTextStyle(element, style, shouldTrimWhiteSpace) {
    // applies to span
    var color = style.color;
    if (color) {
        element.style.color = ttmlColorToCSSColor(color);
    }
    // applies to body, div, p, region, span
    var backgroundColor = style.backgroundColor;
    if (backgroundColor) {
        element.style.backgroundColor = ttmlColorToCSSColor(backgroundColor);
    }
    // applies to span
    var textOutline = style.textOutline;
    if (textOutline) {
        var outlineData = textOutline.trim().replace(/\s+/g, " ").split(" ");
        var len = outlineData.length;
        if (len === 3) {
            var outlineColor = ttmlColorToCSSColor(outlineData[0]);
            var thickness = outlineData[1];
            element.style.textShadow =
                generateCSSTextOutline(outlineColor, thickness);
        }
        else if (color && len === 1) {
            var thickness = outlineData[0];
            element.style.textShadow = generateCSSTextOutline(color, thickness);
        }
        else if (len === 2) {
            var isFirstArgAColor = /^[#A-Z]/i.test(outlineData[0]);
            var isFirstArgANumber = /^[0-9]/.test(outlineData[0]);
            // XOR-ing to be sure we get what we have
            if (isFirstArgAColor !== isFirstArgANumber) {
                if (isFirstArgAColor) {
                    var outlineColor = ttmlColorToCSSColor(outlineData[0]);
                    var thickness = outlineData[1];
                    element.style.textShadow =
                        generateCSSTextOutline(outlineColor, thickness);
                }
                else if (color) {
                    var thickness = outlineData[0];
                    element.style.textShadow = generateCSSTextOutline(color, thickness);
                }
            }
        }
    }
    // applies to span
    var textDecoration = style.textDecoration;
    if (textDecoration) {
        switch (textDecoration) {
            case "noUnderline":
            case "noLineThrough":
            case "noOverline":
                element.style.textDecoration = "none";
                break;
            case "lineThrough":
                element.style.textDecoration = "line-through";
                break;
            default:
                element.style.textDecoration = textDecoration;
                break;
        }
    }
    // applies to span
    var fontFamily = style.fontFamily;
    if (fontFamily) {
        switch (fontFamily) {
            case "proportionalSansSerif":
                element.style.fontFamily =
                    "Arial, Helvetica, Liberation Sans, sans-serif";
                break;
            // TODO monospace or sans-serif or font with both?
            case "monospaceSansSerif":
            case "sansSerif":
                element.style.fontFamily = "sans-serif";
                break;
            case "monospaceSerif":
            case "default":
                element.style.fontFamily = "Courier New, Liberation Mono, monospace";
                break;
            // TODO font with both?
            case "proportionalSerif":
                element.style.fontFamily = "serif";
                break;
            default:
                element.style.fontFamily = fontFamily;
        }
    }
    // applies to span
    var fontStyle = style.fontStyle;
    if (fontStyle) {
        element.style.fontStyle = fontStyle;
    }
    // applies to span
    var fontWeight = style.fontWeight;
    if (fontWeight) {
        element.style.fontWeight = fontWeight;
    }
    // applies to span
    var fontSize = style.fontSize;
    if (fontSize) {
        // TODO Check if formats are always really 1:1
        element.style.fontSize = fontSize;
    }
    // applies to p, span
    var direction = style.direction;
    if (direction) {
        element.style.direction = direction;
    }
    // applies to p, span
    var unicodeBidi = style.unicodeBidi;
    if (unicodeBidi) {
        switch (unicodeBidi) {
            case "bidiOverride":
                element.style.unicodeBidi = "bidi-override";
                break;
            case "embed":
                element.style.unicodeBidi = "embed";
                break;
            default:
                element.style.unicodeBidi = "normal";
        }
    }
    // applies to body, div, p, region, span
    var visibility = style.visibility;
    if (visibility) {
        element.style.visibility = visibility;
    }
    // applies to body, div, p, region, span
    var display = style.display;
    if (display === "none") {
        element.style.display = "none";
    }
    // applies to body, div, p, region, span
    var wrapOption = style.wrapOption;
    element.style.whiteSpace = wrapOption === "noWrap" ?
        (shouldTrimWhiteSpace ? "nowrap" : "pre") :
        (shouldTrimWhiteSpace ? "normal" : "pre-wrap");
}
/**
 * Apply style for the general text track div.
 * @param {HTMLElement} element - The <div> the style will be applied on.
 * @param {Object} style - The general style object of the paragraph.
 */
function applyGeneralStyle(element, style) {
    // applies to tt, region
    var extent = style.extent;
    if (extent) {
        var results = REGXP_PERCENT_VALUES.exec(extent);
        if (results != null) {
            element.style.width = results[1] + "%";
            element.style.height = results[2] + "%";
        }
    }
    // applies to region
    var writingMode = style.writingMode;
    if (writingMode) {
        // TODO
    }
    // applies to region
    var overflow = style.overflow;
    element.style.overflow = overflow || "hidden";
    // applies to region
    var padding = style.padding;
    if (padding) {
        element.style.padding = padding;
    }
    // applies to region
    var origin = style.origin;
    if (origin) {
        var resultsPercent = REGXP_PERCENT_VALUES.exec(origin);
        if (resultsPercent != null) {
            element.style.position = "relative";
            element.style.left = resultsPercent[1] + "%";
            element.style.top = resultsPercent[2] + "%";
        }
        else {
            // TODO also px
        }
    }
    // applies to region
    var displayAlign = style.displayAlign;
    element.style.display = "flex";
    element.style.flexDirection = "column";
    if (displayAlign) {
        switch (displayAlign) {
            case "before":
                element.style.justifyContent = "flex-start";
                break;
            case "center":
                element.style.justifyContent = "center";
                break;
            case "after":
                element.style.justifyContent = "flex-end";
                break;
        }
    }
    // applies to region
    var opacity = style.opacity;
    if (opacity) {
        element.style.opacity = opacity;
    }
    // applies to body, div, p, region, span
    var visibility = style.visibility;
    if (visibility) {
        element.style.visibility = visibility;
    }
    // applies to body, div, p, region, span
    var display = style.display;
    if (display === "none") {
        element.style.display = "none";
    }
}
/**
 * Apply style set for a <p> element
 * @param {HTMLElement} element - The <p> element
 * @param {Object} style - The general style object of the paragraph.
 */
function applyPStyle(element, style) {
    // applies to body, div, p, region, span
    var paragraphBackgroundColor = style.backgroundColor;
    if (paragraphBackgroundColor) {
        element.style.backgroundColor =
            ttmlColorToCSSColor(paragraphBackgroundColor);
    }
    // applies to p
    var lineHeight = style.lineHeight;
    if (lineHeight) {
        element.style.lineHeight = lineHeight;
    }
    // applies to p
    var textAlign = style.textAlign;
    if (textAlign) {
        switch (textAlign) {
            case "center":
                element.style.textAlign = "center";
                break;
            case "left":
            case "start":
                // TODO check what start means (difference with left, writing direction?)
                element.style.textAlign = "left";
                break;
            case "right":
            case "end":
                // TODO check what end means (difference with right, writing direction?)
                element.style.textAlign = "right";
                break;
        }
    }
}
/**
 * Creates span of text for the given #text element, with the right style.
 *
 * TODO create text elements as string? Might help performances.
 * @param {Element} el - the #text element, which text content should be
 * displayed
 * @param {Object} style - the style object for the given text
 * @param {Boolean} shouldTrimWhiteSpace - True if the space should be
 * trimmed.
 * @returns {HTMLElement}
 */
function createTextElement(el, style, shouldTrimWhiteSpace) {
    var textElement = document.createElement("span");
    var textContent = el.textContent || "";
    if (shouldTrimWhiteSpace) {
        // 1. Trim leading and trailing whitespace.
        // 2. Collapse multiple spaces into one.
        var trimmed = textContent.trim();
        trimmed = trimmed.replace(/\s+/g, " ");
        textContent = trimmed;
    }
    textElement.innerHTML = textContent;
    textElement.className = "rxp-texttrack-span";
    applyTextStyle(textElement, style, shouldTrimWhiteSpace);
    return textElement;
}
/**
 * Generate every text elements to display in a given paragraph.
 * @param {Element} paragraph - The <p> tag.
 * @param {Array.<Object>} regions
 * @param {Array.<Object>} styles
 * @param {Object} paragraphStyle - The general style object of the paragraph.
 * @param {Boolean} shouldTrimWhiteSpace
 * @returns {Array.<HTMLElement>}
 */
function generateTextContent(paragraph, regions, styles, paragraphStyle, shouldTrimWhiteSpace) {
    /**
     * Recursive function, taking a node in argument and returning the
     * corresponding array of HTMLElement in order.
     * @param {Node} node - the node in question
     * @param {Object} style - the current state of the style for the node.
     * /!\ The style object can be mutated, provide a copy of it.
     * @param {Array.<Element>} spans - The spans parent of this node.
     * @param {Boolean} shouldTrimWhiteSpaceFromParent - True if the space should be
     * trimmed by default. From the parent xml:space parameter.
     * @returns {Array.<HTMLElement>}
     */
    function loop(node, style, spans, shouldTrimWhiteSpaceFromParent) {
        var childNodes = node.childNodes;
        var elements = [];
        for (var i = 0; i < childNodes.length; i++) {
            var currentNode = childNodes[i];
            if (currentNode.nodeName === "#text") {
                var backgroundColor = getStylingAttributes(["backgroundColor"], spans, styles, regions).backgroundColor;
                if (backgroundColor) {
                    style.backgroundColor = backgroundColor;
                }
                else {
                    delete style.backgroundColor;
                }
                var el = createTextElement(currentNode, style, shouldTrimWhiteSpaceFromParent);
                elements.push(el);
            }
            else if (currentNode.nodeName === "br") {
                var br = document.createElement("BR");
                elements.push(br);
            }
            else if (currentNode.nodeName === "span" &&
                currentNode.nodeType === Node.ELEMENT_NODE &&
                currentNode.childNodes.length > 0) {
                var spaceAttribute = currentNode.getAttribute("xml:space");
                var shouldTrimWhiteSpaceOnSpan = spaceAttribute ?
                    spaceAttribute === "default" : shouldTrimWhiteSpaceFromParent;
                // compute the new applyable style
                var newStyle = objectAssign({}, style, getStylingAttributes(SPAN_LEVEL_ATTRIBUTES, [currentNode], styles, regions));
                elements.push.apply(elements, loop(currentNode, newStyle, [currentNode].concat(spans), shouldTrimWhiteSpaceOnSpan));
            }
        }
        return elements;
    }
    return loop(paragraph, objectAssign({}, paragraphStyle), [], shouldTrimWhiteSpace);
}
/**
 * @param {Element} paragraph
 * @param {Element} body
 * @param {Array.<Object>} regions
 * @param {Array.<Object>} styles
 * @param {Object} paragraphStyle
 * @param {Boolean} shouldTrimWhiteSpaceOnParagraph
 * @returns {HTMLElement}
 */
export default function createElement(paragraph, body, regions, styles, paragraphStyle, shouldTrimWhiteSpace) {
    var divs = getParentElementsByTagName(paragraph, "div");
    var parentElement = document.createElement("DIV");
    parentElement.className = "rxp-texttrack-region";
    applyGeneralStyle(parentElement, paragraphStyle);
    if (body) {
        // applies to body, div, p, region, span
        var bodyBackgroundColor = getStylingAttributes(["backgroundColor"], divs.concat([body]), styles, regions).bodyBackgroundColor;
        if (bodyBackgroundColor) {
            parentElement.style.backgroundColor =
                ttmlColorToCSSColor(bodyBackgroundColor);
        }
    }
    var pElement = document.createElement("p");
    pElement.className = "rxp-texttrack-p";
    applyPStyle(pElement, paragraphStyle);
    var textContent = generateTextContent(paragraph, regions, styles, paragraphStyle, shouldTrimWhiteSpace);
    for (var i = 0; i < textContent.length; i++) {
        pElement.appendChild(textContent[i]);
    }
    // NOTE:
    // The following code is for the inclusion of div elements. This has no
    // advantage for now, and might only with future evolutions.
    // (This is only an indication of what the base of the code could look like).
    // if (divs.length) {
    //   let container = parentElement;
    //   for (let i = divs.length - 1; i >= 0; i--) {
    //     // TODO manage style at div level?
    //     // They are: visibility, display and backgroundColor
    //     // All these do not have any difference if applied to the <p> element
    //     // instead of the div.
    //     // The advantage might only be for multiple <p> elements dispatched
    //     // in multiple div Which we do not manage anyway for now.
    //     const divEl = document.createElement("DIV");
    //     divEl.className = "rxp-texttrack-div";
    //     container.appendChild(divEl);
    //     container = divEl;
    //   }
    //   container.appendChild(pElement);
    //   parentElement.appendChild(container);
    // } else {
    //   parentElement.appendChild(pElement);
    // }
    parentElement.appendChild(pElement);
    return parentElement;
}

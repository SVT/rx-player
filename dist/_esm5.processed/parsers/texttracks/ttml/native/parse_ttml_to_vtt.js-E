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
import { isVTTCue, makeVTTCue, } from "../../../../compat";
import arrayFind from "../../../../utils/array_find";
import getParameters from "../get_parameters";
import getParentElementsByTagName from "../get_parent_elements_by_tag_name";
import { getStylingAttributes, getStylingFromElement, } from "../get_styling";
import getTimeDelimiters from "../get_time_delimiters";
import { getBodyNode, getRegionNodes, getStyleNodes, getTextNodes, } from "../nodes";
import { REGXP_PERCENT_VALUES, } from "../regexps";
/**
 * Style attributes currently used.
 */
var WANTED_STYLE_ATTRIBUTES = [
    "extent",
    "writingMode",
    "origin",
    "align",
];
/**
 * @type {Object}
 */
var TEXT_ALIGN_TO_LIGN_ALIGN = {
    left: "start",
    center: "center",
    right: "end",
    start: "start",
    end: "end",
};
/**
 * @type {Object}
 */
var TEXT_ALIGN_TO_POSITION_ALIGN = {
    left: "line-left",
    center: "center",
    right: "line-right",
};
/**
 * @param {string} str
 * @param {Number} timeOffset
 * @returns {Array.<VTTCue|TextTrackCue>}
 */
function parseTTMLStringToVTT(str, timeOffset) {
    var ret = [];
    var xml = new DOMParser().parseFromString(str, "text/xml");
    if (xml) {
        var tts = xml.getElementsByTagName("tt");
        var tt = tts[0];
        if (!tt) {
            throw new Error("invalid XML");
        }
        var body = getBodyNode(tt);
        var styleNodes = getStyleNodes(tt);
        var regionNodes = getRegionNodes(tt);
        var paragraphNodes = getTextNodes(tt);
        var params = getParameters(tt);
        // construct styles array based on the xml as an optimization
        var styles = [];
        for (var i = 0; i <= styleNodes.length - 1; i++) {
            // TODO styles referencing other styles
            var styleNode = styleNodes[i];
            if (styleNode instanceof Element) {
                var styleID = styleNode.getAttribute("xml:id");
                if (styleID != null) {
                    styles.push({
                        id: styleID,
                        style: getStylingFromElement(styleNode),
                    });
                }
            }
        }
        // construct regions array based on the xml as an optimization
        var regions = [];
        var _loop_1 = function (i) {
            var regionNode = regionNodes[i];
            if (regionNode instanceof Element) {
                var regionID = regionNode.getAttribute("xml:id");
                if (regionID != null) {
                    var regionStyle = getStylingFromElement(regionNode);
                    var associatedStyle_1 = regionNode.getAttribute("style");
                    if (associatedStyle_1) {
                        var style = arrayFind(styles, function (x) { return x.id === associatedStyle_1; });
                        if (style) {
                            regionStyle = objectAssign({}, style.style, regionStyle);
                        }
                    }
                    regions.push({
                        id: regionID,
                        style: regionStyle,
                    });
                }
            }
        };
        for (var i = 0; i <= regionNodes.length - 1; i++) {
            _loop_1(i);
        }
        // Computing the style takes a lot of ressources.
        // To avoid too much re-computation, let's compute the body style right
        // now and do the rest progressively.
        var bodyStyle = body ?
            getStylingAttributes(WANTED_STYLE_ATTRIBUTES, [body], styles, regions) :
            getStylingAttributes(WANTED_STYLE_ATTRIBUTES, [], styles, regions);
        var bodySpaceAttribute = body ? body.getAttribute("xml:space") : undefined;
        var shouldTrimWhiteSpaceOnBody = bodySpaceAttribute === "default" || params.spaceStyle === "default";
        for (var i = 0; i < paragraphNodes.length; i++) {
            var paragraph = paragraphNodes[i];
            if (paragraph instanceof Element) {
                var divs = getParentElementsByTagName(paragraph, "div");
                var paragraphStyle = objectAssign({}, bodyStyle, getStylingAttributes(WANTED_STYLE_ATTRIBUTES, [paragraph].concat(divs), styles, regions));
                var paragraphSpaceAttribute = paragraph.getAttribute("xml:space");
                var shouldTrimWhiteSpaceOnParagraph = paragraphSpaceAttribute ?
                    paragraphSpaceAttribute === "default" : shouldTrimWhiteSpaceOnBody;
                var cue = parseCue(paragraph, timeOffset, styles, regions, paragraphStyle, params, shouldTrimWhiteSpaceOnParagraph);
                if (cue) {
                    ret.push(cue);
                }
            }
        }
    }
    return ret;
}
/**
 * Parses an Element into a TextTrackCue or VTTCue.
 * /!\ Mutates the given cueElement Element
 * @param {Element} paragraph
 * @param {Number} offset
 * @param {Array.<Object>} styles
 * @param {Array.<Object>} regions
 * @param {Object} paragraphStyle
 * @param {Object} params
 * @param {Boolean} shouldTrimWhiteSpaceOnParagraph
 * @returns {TextTrackCue|null}
 */
function parseCue(paragraph, offset, _styles, _regions, paragraphStyle, params, shouldTrimWhiteSpace) {
    // Disregard empty elements:
    // TTML allows for empty elements like <div></div>.
    // If paragraph has neither time attributes, nor
    // non-whitespace text, don't try to make a cue out of it.
    if (!paragraph.hasAttribute("begin") && !paragraph.hasAttribute("end") &&
        /^\s*$/.test(paragraph.textContent || "")) {
        return null;
    }
    var _a = getTimeDelimiters(paragraph, params), start = _a.start, end = _a.end;
    var text = generateTextContent(paragraph, shouldTrimWhiteSpace);
    var cue = makeVTTCue(start + offset, end + offset, text);
    if (!cue) {
        return null;
    }
    if (isVTTCue(cue)) {
        addStyle(cue, paragraphStyle);
    }
    return cue;
}
/**
 * Generate text to display for a given paragraph.
 * @param {Element} paragraph - The <p> tag.
 * @param {Boolean} shouldTrimWhiteSpaceForParagraph
 * @returns {string}
 */
function generateTextContent(paragraph, shouldTrimWhiteSpaceForParagraph) {
    /**
     * Recursive function, taking a node in argument and returning the
     * corresponding string.
     * @param {Node} node - the node in question
     * @returns {string}
     */
    function loop(node, shouldTrimWhiteSpaceFromParent) {
        var childNodes = node.childNodes;
        var text = "";
        for (var i = 0; i < childNodes.length; i++) {
            var currentNode = childNodes[i];
            if (currentNode.nodeName === "#text") {
                var textContent = currentNode.textContent || "";
                if (shouldTrimWhiteSpaceFromParent) {
                    // 1. Trim leading and trailing whitespace.
                    // 2. Collapse multiple spaces into one.
                    var trimmed = textContent.trim();
                    trimmed = trimmed.replace(/\s+/g, " ");
                    textContent = trimmed;
                }
                // DOM Parser turns HTML escape caracters into caracters,
                // that may be misinterpreted by VTTCue API (typically, less-than sign
                // and greater-than sign can be interpreted as HTML tags signs).
                // Original escaped caracters must be conserved.
                var escapedTextContent = textContent
                    .replace(/&|\u0026/g, "&amp;")
                    .replace(/<|\u003C/g, "&lt;")
                    .replace(/>|\u2265/g, "&gt;")
                    .replace(/\u200E/g, "&lrm;")
                    .replace(/\u200F/g, "&rlm;")
                    .replace(/\u00A0/g, "&nbsp;");
                text += escapedTextContent;
            }
            else if (currentNode.nodeName === "br") {
                text += "\n";
            }
            else if (currentNode.nodeName === "span" &&
                currentNode.nodeType === Node.ELEMENT_NODE &&
                currentNode.childNodes.length > 0) {
                var spaceAttribute = currentNode.getAttribute("xml:space");
                var shouldTrimWhiteSpaceForSpan = spaceAttribute ?
                    spaceAttribute === "default" : shouldTrimWhiteSpaceFromParent;
                text += loop(currentNode, shouldTrimWhiteSpaceForSpan);
            }
        }
        return text;
    }
    return loop(paragraph, shouldTrimWhiteSpaceForParagraph);
}
/**
 * Adds applicable style properties to a cue.
 * /!\ Mutates cue argument.
 * @param {VTTCue} cue
 * @param {Object} style
 */
function addStyle(cue, style) {
    var extent = style.extent;
    if (extent) {
        var results = REGXP_PERCENT_VALUES.exec(extent);
        if (results != null) {
            // Use width value of the extent attribute for size.
            // Height value is ignored.
            cue.size = Number(results[1]);
        }
    }
    var writingMode = style.writingMode;
    // let isVerticalText = true;
    switch (writingMode) {
        case "tb":
        case "tblr":
            cue.vertical = "lr";
            break;
        case "tbrl":
            cue.vertical = "rl";
            break;
        default:
            // isVerticalText = false;
            break;
    }
    var origin = style.origin;
    if (origin) {
        var results = REGXP_PERCENT_VALUES.exec(origin);
        if (results != null) {
            // for vertical text use first coordinate of tts:origin
            // to represent line of the cue and second - for position.
            // Otherwise (horizontal), use them the other way around.
            // if (isVerticalText) {
            // TODO check and uncomment
            // cue.position = Number(results[2]);
            // cue.line = Number(results[1]);
            // } else {
            // TODO check and uncomment
            // cue.position = Number(results[1]);
            // cue.line = Number(results[2]);
            // }
            // A boolean indicating whether the line is an integer
            // number of lines (using the line dimensions of the first
            // line of the cue), or whether it is a percentage of the
            // dimension of the video. The flag is set to true when lines
            // are counted, and false otherwise.
            // TODO check and uncomment
            // cue.snapToLines = false;
        }
    }
    var align = style.align;
    if (align) {
        cue.align = align;
        if (align === "center") {
            if (cue.align !== "center") {
                // Workaround for a Chrome bug http://crbug.com/663797
                // Chrome does not support align = "center"
                cue.align = "middle";
            }
            cue.position = "auto";
        }
        cue.positionAlign = TEXT_ALIGN_TO_POSITION_ALIGN[align] || "";
        cue.lineAlign = TEXT_ALIGN_TO_LIGN_ALIGN[align] || "";
    }
}
export default parseTTMLStringToVTT;

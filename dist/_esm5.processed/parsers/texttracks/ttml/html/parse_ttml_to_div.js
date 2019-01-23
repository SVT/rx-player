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
import arrayFind from "../../../../utils/array_find";
import getParameters from "../get_parameters";
import getParentElementsByTagName from "../get_parent_elements_by_tag_name";
import { getStylingAttributes, getStylingFromElement, } from "../get_styling";
import { getBodyNode, getRegionNodes, getStyleNodes, getTextNodes, } from "../nodes";
import parseCue from "./parse_cue";
var STYLE_ATTRIBUTES = [
    "backgroundColor",
    "color",
    "direction",
    "display",
    "displayAlign",
    "extent",
    "fontFamily",
    "fontSize",
    "fontStyle",
    "fontWeight",
    "lineHeight",
    "opacity",
    "origin",
    "overflow",
    "padding",
    "textAlign",
    "textDecoration",
    "textOutline",
    "unicodeBidi",
    "visibility",
    "wrapOption",
    "writingMode",
];
/**
 * Create array of objects which should represent the given TTML text track.
 * These objects have the following structure
 *   - start {Number}: start time, in seconds, at which the cue should
 *     be displayed
 *   - end {Number}: end time, in seconds, at which the cue should
 *     be displayed
 *   - element {HTMLElement}: <div> element representing the cue, with the
 *     right style. This div should then be appended to an element having
 *     the exact size of the wanted region the text track provide cues for.
 *
 * TODO TTML parsing is still pretty heavy on the CPU.
 * Optimizations have been done, principally to avoid using too much XML APIs,
 * but we can still do better.
 * @param {string} str
 * @param {Number} timeOffset
 * @returns {Array.<Object>}
 */
export default function parseTTMLStringToDIV(str, timeOffset) {
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
            var styleNode = styleNodes[i];
            if (styleNode instanceof Element) {
                var styleID = styleNode.getAttribute("xml:id");
                if (styleID !== null) {
                    // TODO styles referencing other styles
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
                if (regionID !== null) {
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
        // TODO Compute corresponding CSS style here (as soon as we now the TTML
        // style) to speed up the process even
        // more.
        var bodyStyle = body !== null ?
            getStylingAttributes(STYLE_ATTRIBUTES, [body], styles, regions) :
            getStylingAttributes(STYLE_ATTRIBUTES, [], styles, regions);
        var bodySpaceAttribute = body ? body.getAttribute("xml:space") : undefined;
        var shouldTrimWhiteSpaceOnBody = bodySpaceAttribute === "default" || params.spaceStyle === "default";
        for (var i = 0; i < paragraphNodes.length; i++) {
            var paragraph = paragraphNodes[i];
            if (paragraph instanceof Element) {
                var divs = getParentElementsByTagName(paragraph, "div");
                var paragraphStyle = objectAssign({}, bodyStyle, getStylingAttributes(STYLE_ATTRIBUTES, [paragraph].concat(divs), styles, regions));
                var paragraphSpaceAttribute = paragraph.getAttribute("xml:space");
                var shouldTrimWhiteSpaceOnParagraph = paragraphSpaceAttribute ?
                    paragraphSpaceAttribute === "default" : shouldTrimWhiteSpaceOnBody;
                var cue = parseCue(paragraph, timeOffset, styles, regions, body, paragraphStyle, params, shouldTrimWhiteSpaceOnParagraph);
                if (cue) {
                    ret.push(cue);
                }
            }
        }
    }
    return ret;
}

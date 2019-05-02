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
import parseSegmentBase from "./SegmentBase";
import parseSegmentTimeline from "./SegmentTimeline";
import { parseBoolean, } from "./utils";
/**
 * Parse initialization attribute found in segment Template to
 * correspond to the initialization found in a regular segmentBase.
 * @param {string} attrValue
 * @returns {Object}
 */
function parseInitializationAttribute(attrValue) {
    return { media: attrValue };
}
/**
 * @param {Element} root
 * @returns {Object}
 */
export default function parseSegmentTemplate(root) {
    var base = parseSegmentBase(root);
    var ret;
    var index;
    var media;
    var bitstreamSwitching;
    var timeline;
    for (var i = 0; i < root.childNodes.length; i++) {
        if (root.childNodes[i].nodeType === Node.ELEMENT_NODE) {
            var currentNode = root.childNodes[i];
            if (currentNode.nodeName === "SegmentTimeline") {
                timeline = parseSegmentTimeline(currentNode);
            }
        }
    }
    for (var i = 0; i < root.attributes.length; i++) {
        var attribute = root.attributes[i];
        switch (attribute.nodeName) {
            case "initialization":
                if (base.initialization == null) {
                    base.initialization = parseInitializationAttribute(attribute.value);
                }
                break;
            case "index":
                index = attribute.value;
                break;
            case "media":
                media = attribute.value;
                break;
            case "bitstreamSwitching":
                bitstreamSwitching = parseBoolean(attribute.value);
                break;
        }
    }
    if (timeline != null) {
        ret = objectAssign({}, base, {
            indexType: "timeline",
            timeline: timeline,
        });
    }
    else {
        var segmentDuration = base.duration;
        if (segmentDuration == null) {
            throw new Error("Invalid SegmentTemplate: no duration");
        }
        ret = objectAssign({}, base, {
            indexType: "template",
            duration: segmentDuration,
        });
    }
    if (index != null) {
        ret.index = index;
    }
    if (media != null) {
        ret.media = media;
    }
    if (bitstreamSwitching != null) {
        ret.bitstreamSwitching = bitstreamSwitching;
    }
    return ret;
}

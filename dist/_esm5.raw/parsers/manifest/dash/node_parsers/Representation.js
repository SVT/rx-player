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
import log from "../../../../log";
import parseSegmentBase from "./SegmentBase";
import parseSegmentList from "./SegmentList";
import parseSegmentTemplate from "./SegmentTemplate";
import { parseBoolean } from "./utils";
/**
 * @param {NodeList} representationChildren
 * @returns {Object}
 */
function parseRepresentationChildren(representationChildren) {
    var children = {
        baseURL: "",
    };
    for (var i = 0; i < representationChildren.length; i++) {
        if (representationChildren[i].nodeType === Node.ELEMENT_NODE) {
            var currentElement = representationChildren[i];
            switch (currentElement.nodeName) {
                case "BaseURL":
                    children.baseURL = currentElement.textContent || "";
                    break;
                case "SegmentBase":
                    children.segmentBase = parseSegmentBase(currentElement);
                    break;
                case "SegmentList":
                    children.segmentList = parseSegmentList(currentElement);
                    break;
                case "SegmentTemplate":
                    children.segmentTemplate = parseSegmentTemplate(currentElement);
                    break;
            }
        }
    }
    return children;
}
/**
 * @param {Element} representationElement
 * @returns {Object}
 */
function parseRepresentationAttributes(representationElement) {
    var attributes = {};
    for (var i = 0; i < representationElement.attributes.length; i++) {
        var attribute = representationElement.attributes[i];
        switch (attribute.name) {
            case "audioSamplingRate":
                attributes.audioSamplingRate = attribute.value;
                break;
            case "bandwidth":
                {
                    var bitrate = parseInt(attribute.value, 10);
                    if (isNaN(bitrate)) {
                        log.warn("DASH: invalid bandwidth (\"" + attribute.value + "\")");
                    }
                    else {
                        attributes.bitrate = bitrate;
                    }
                }
                break;
            case "codecs":
                attributes.codecs = attribute.value;
                break;
            case "codingDependency":
                attributes.codingDependency = parseBoolean(attribute.value);
                break;
            case "frameRate":
                attributes.frameRate = attribute.value;
                break;
            case "height":
                {
                    var height = parseInt(attribute.value, 10);
                    if (isNaN(height)) {
                        log.warn("DASH: invalid height (\"" + attribute.value + "\")");
                    }
                    else {
                        attributes.height = height;
                    }
                }
                break;
            case "id":
                attributes.id = attribute.value;
                break;
            case "maxPlayoutRate":
                {
                    var maxPlayoutRate = parseFloat(attribute.value);
                    if (isNaN(maxPlayoutRate)) {
                        log.warn("DASH: invalid maxPlayoutRate (\"" + attribute.value + "\")");
                    }
                    else {
                        attributes.maxPlayoutRate = maxPlayoutRate;
                    }
                }
                break;
            case "maximumSAPPeriod":
                {
                    var maximumSAPPeriod = parseFloat(attribute.value);
                    if (isNaN(maximumSAPPeriod)) {
                        log.warn("DASH: invalid maximumSAPPeriod (\"" + attribute.value + "\")");
                    }
                    else {
                        attributes.maximumSAPPeriod = maximumSAPPeriod;
                    }
                }
                break;
            case "mimeType":
                attributes.mimeType = attribute.value;
                break;
            case "profiles":
                attributes.profiles = attribute.value;
                break;
            case "qualityRanking":
                {
                    var qualityRanking = parseInt(attribute.value, 10);
                    if (isNaN(qualityRanking)) {
                        log.warn("DASH: invalid qualityRanking (\"" + attribute.value + "\")");
                    }
                    else {
                        attributes.qualityRanking = qualityRanking;
                    }
                }
                break;
            case "segmentProfiles":
                attributes.segmentProfiles = attribute.value;
                break;
            case "width":
                {
                    var width = parseInt(attribute.value, 10);
                    if (isNaN(width)) {
                        log.warn("DASH: invalid width (\"" + attribute.value + "\")");
                    }
                    else {
                        attributes.width = width;
                    }
                }
                break;
        }
    }
    return attributes;
}
export function createRepresentationIntermediateRepresentation(representationElement) {
    return {
        children: parseRepresentationChildren(representationElement.childNodes),
        attributes: parseRepresentationAttributes(representationElement),
    };
}

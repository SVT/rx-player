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
import { createPeriodIntermediateRepresentation, } from "./Period";
import { parseDateTime, parseDuration, parseScheme, } from "./utils";
/**
 * Parse children of the MPD's root into a simple object.
 * @param {NodeList} mpdChildren
 * @returns {Object}
 */
function parseMPDChildren(mpdChildren) {
    var baseURL = "";
    var locations = [];
    var periods = [];
    var utcTimings = [];
    for (var i = 0; i < mpdChildren.length; i++) {
        if (mpdChildren[i].nodeType === Node.ELEMENT_NODE) {
            var currentNode = mpdChildren[i];
            switch (currentNode.nodeName) {
                case "BaseURL":
                    baseURL = currentNode.textContent || "";
                    break;
                case "Location":
                    locations.push(currentNode.textContent || "");
                    break;
                case "Period":
                    var period = createPeriodIntermediateRepresentation(currentNode);
                    periods.push(period);
                    break;
                case "UTCTiming":
                    var utcTiming = parseScheme(currentNode);
                    utcTimings.push(utcTiming);
                    break;
            }
        }
    }
    return { baseURL: baseURL, locations: locations, periods: periods, utcTimings: utcTimings };
}
/**
 * @param {Element} root
 * @returns {Object}
 */
function parseMPDAttributes(root) {
    var res = {};
    for (var i = 0; i < root.attributes.length; i++) {
        var attribute = root.attributes[i];
        switch (attribute.name) {
            case "id":
                res.id = attribute.value;
                break;
            case "profiles":
                res.profiles = attribute.value;
                break;
            case "type":
                res.type = attribute.value;
                break;
            case "availabilityStartTime":
                res.availabilityStartTime = +parseDateTime(attribute.value);
                break;
            case "availabilityEndTime":
                res.availabilityEndTime = +parseDateTime(attribute.value);
                break;
            case "publishTime":
                res.publishTime = +parseDateTime(attribute.value);
                break;
            case "mediaPresentationDuration":
                res.duration = parseDuration(attribute.value);
                break;
            case "minimumUpdatePeriod":
                res.minimumUpdatePeriod = parseDuration(attribute.value);
                break;
            case "minBufferTime":
                res.minBufferTime = parseDuration(attribute.value);
                break;
            case "timeShiftBufferDepth":
                res.timeShiftBufferDepth = parseDuration(attribute.value);
                break;
            case "suggestedPresentationDelay":
                res.suggestedPresentationDelay = parseDuration(attribute.value);
                break;
            case "maxSegmentDuration":
                res.maxSegmentDuration = parseDuration(attribute.value);
                break;
            case "maxSubsegmentDuration":
                res.maxSubsegmentDuration = parseDuration(attribute.value);
                break;
        }
    }
    return res;
}
export function createMPDIntermediateRepresentation(root) {
    return {
        children: parseMPDChildren(root.childNodes),
        attributes: parseMPDAttributes(root),
    };
}

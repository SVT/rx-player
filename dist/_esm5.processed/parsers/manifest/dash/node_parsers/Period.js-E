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
import { createAdaptationSetIntermediateRepresentation, } from "./AdaptationSet";
import { parseBoolean, parseDuration, } from "./utils";
/**
 * @param {NodeList} periodChildren
 * @returns {Object}
 */
function parsePeriodChildren(periodChildren) {
    var baseURL = "";
    var adaptations = [];
    for (var i = 0; i < periodChildren.length; i++) {
        if (periodChildren[i].nodeType === Node.ELEMENT_NODE) {
            var currentElement = periodChildren[i];
            switch (currentElement.nodeName) {
                case "BaseURL":
                    baseURL = currentElement.textContent || "";
                    break;
                case "AdaptationSet":
                    var adaptation = createAdaptationSetIntermediateRepresentation(currentElement);
                    adaptations.push(adaptation);
                    break;
            }
        }
    }
    return { baseURL: baseURL, adaptations: adaptations };
}
/**
 * @param {Element} periodElement
 * @returns {Object}
 */
function parsePeriodAttributes(periodElement) {
    var res = {};
    for (var i = 0; i < periodElement.attributes.length; i++) {
        var attribute = periodElement.attributes[i];
        switch (attribute.name) {
            case "id":
                res.id = attribute.value;
                break;
            case "start":
                {
                    var tempStart = parseDuration(attribute.value);
                    if (!isNaN(tempStart)) {
                        res.start = tempStart;
                    }
                    else {
                        log.warn("DASH: Unrecognized start in the mpd:", attribute.value);
                    }
                }
                break;
            case "duration":
                {
                    var tempDuration = parseDuration(attribute.value);
                    if (!isNaN(tempDuration)) {
                        res.duration = tempDuration;
                    }
                    else {
                        log.warn("DASH: Unrecognized duration in the mpd:", attribute.value);
                    }
                }
                break;
            case "bitstreamSwitching":
                res.bitstreamSwitching = parseBoolean(attribute.value);
                break;
            case "xlink:href":
                res.xlinkHref = attribute.value;
                break;
            case "xlink:actuate":
                res.xlinkActuate = attribute.value;
                break;
        }
    }
    return res;
}
export function createPeriodIntermediateRepresentation(periodElement) {
    return {
        children: parsePeriodChildren(periodElement.childNodes),
        attributes: parsePeriodAttributes(periodElement),
    };
}

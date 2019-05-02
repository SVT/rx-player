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
import log from "../../../log";
import arrayFind from "../../../utils/array_find";
import arrayIncludes from "../../../utils/array_includes";
import resolveURL from "../../../utils/resolve_url";
import inferAdaptationType from "./infer_adaptation_type";
import parseRepresentations from "./parse_representations";
/**
 * Detect if the accessibility given defines an adaptation for the visually
 * impaired.
 * Based on DVB Document A168 (DVB-DASH).
 * @param {Object} accessibility
 * @returns {Boolean}
 */
function isVisuallyImpaired(accessibility) {
    if (!accessibility) {
        return false;
    }
    return (accessibility.schemeIdUri === "urn:tva:metadata:cs:AudioPurposeCS:2007" &&
        accessibility.value === "1");
}
/**
 * Detect if the accessibility given defines an adaptation for the hard of
 * hearing.
 * Based on DVB Document A168 (DVB-DASH).
 * @param {Object} accessibility
 * @returns {Boolean}
 */
function isHardOfHearing(accessibility) {
    if (!accessibility) {
        return false;
    }
    return (accessibility.schemeIdUri === "urn:tva:metadata:cs:AudioPurposeCS:2007" &&
        accessibility.value === "2");
}
/**
 * Contruct Adaptation ID from the informations we have.
 * @param {Object} adaptation
 * @param {Array.<Object>} representations
 * @param {Object} infos
 * @returns {string}
 */
function getAdaptationID(adaptation, representations, infos) {
    if (adaptation.attributes.id) {
        return adaptation.attributes.id;
    }
    var idString = infos.type;
    if (adaptation.attributes.language) {
        idString += "-" + adaptation.attributes.language;
    }
    if (infos.isClosedCaption) {
        idString += "-cc";
    }
    if (infos.isAudioDescription) {
        idString += "-ad";
    }
    if (adaptation.attributes.contentType) {
        idString += "-" + adaptation.attributes.contentType;
    }
    if (adaptation.attributes.codecs) {
        idString += "-" + adaptation.attributes.codecs;
    }
    if (adaptation.attributes.mimeType) {
        idString += "-" + adaptation.attributes.mimeType;
    }
    if (adaptation.attributes.frameRate) {
        idString += "-" + adaptation.attributes.frameRate;
    }
    if (idString.length === infos.type.length) {
        idString += representations.length ?
            ("-" + representations[0].id) : "-empty";
    }
    return "adaptation-" + idString;
}
/**
 * Returns a list of ID this adaptation can be seamlessly switched to
 * @param {Object} adaptation
 * @returns {Array.<string>}
 */
function getAdaptationSetSwitchingIDs(adaptation) {
    if (adaptation.children.supplementalProperties != null) {
        var supplementalProperties = adaptation.children.supplementalProperties;
        for (var j = 0; j < supplementalProperties.length; j++) {
            var supplementalProperty = supplementalProperties[j];
            if (supplementalProperty.schemeIdUri ===
                "urn:mpeg:dash:adaptation-set-switching:2016" &&
                supplementalProperty.value != null) {
                return supplementalProperty.value.split(",")
                    .map(function (id) { return id.trim(); })
                    .filter(function (id) { return id; });
            }
        }
    }
    return [];
}
/**
 * Process intermediate periods to create final parsed periods.
 * @param {Array.<Object>} periodsIR
 * @param {Object} manifestInfos
 * @returns {Array.<Object>}
 */
export default function parseAdaptationSets(adaptationsIR, periodInfos) {
    return adaptationsIR
        .reduce(function (acc, adaptation) {
        var _a;
        var adaptationChildren = adaptation.children;
        var parsedAdaptations = acc.adaptations;
        var representationsIR = adaptation.children.representations;
        var representations = parseRepresentations(representationsIR, adaptation, {
            isDynamic: periodInfos.isDynamic,
            start: periodInfos.start,
            end: periodInfos.end,
            baseURL: resolveURL(periodInfos.baseURL, adaptationChildren.baseURL),
        });
        var adaptationMimeType = adaptation.attributes.mimeType;
        var adaptationCodecs = adaptation.attributes.codecs;
        var representationMimeTypes = representations
            .map(function (representation) { return representation.mimeType; })
            .filter(function (mimeType) { return mimeType != null; });
        var representationCodecs = representations
            .map(function (representation) { return representation.codecs; })
            .filter(function (codecs) { return codecs != null; });
        var type = inferAdaptationType(adaptationMimeType || null, representationMimeTypes, adaptationCodecs || null, representationCodecs, adaptationChildren.roles || null);
        var originalID = adaptation.attributes.id;
        var newID;
        var adaptationSetSwitchingIDs = getAdaptationSetSwitchingIDs(adaptation);
        // TODO remove "main" video track management
        var roles = adaptationChildren.roles;
        var isMainAdaptation = !!roles &&
            !!arrayFind(roles, function (role) { return role.value === "main"; }) &&
            !!arrayFind(roles, function (role) { return role.schemeIdUri === "urn:mpeg:dash:role:2011"; });
        var videoMainAdaptation = acc.videoMainAdaptation;
        if (type === "video" && videoMainAdaptation !== null && isMainAdaptation) {
            (_a = videoMainAdaptation.representations).push.apply(_a, representations);
            newID = videoMainAdaptation.id;
        }
        else {
            var isClosedCaption = type === "text" && adaptationChildren.accessibility &&
                isHardOfHearing(adaptationChildren.accessibility) ? true : undefined;
            var isAudioDescription = type === "audio" &&
                adaptationChildren.accessibility &&
                isVisuallyImpaired(adaptationChildren.accessibility) ? true : undefined;
            var adaptationID = newID = getAdaptationID(adaptation, representations, { isClosedCaption: isClosedCaption, isAudioDescription: isAudioDescription, type: type });
            var parsedAdaptationSet = {
                id: adaptationID,
                representations: representations,
                type: type,
            };
            if (adaptation.attributes.language != null) {
                parsedAdaptationSet.language = adaptation.attributes.language;
            }
            if (isClosedCaption != null) {
                parsedAdaptationSet.closedCaption = isClosedCaption;
            }
            if (isAudioDescription != null) {
                parsedAdaptationSet.audioDescription = isAudioDescription;
            }
            var adaptationsOfTheSameType = parsedAdaptations[type];
            if (!adaptationsOfTheSameType) {
                parsedAdaptations[type] = [parsedAdaptationSet];
                if (isMainAdaptation && type === "video") {
                    acc.videoMainAdaptation = parsedAdaptationSet;
                }
            }
            else {
                var mergedInto = null;
                var _loop_1 = function (k) {
                    var _a;
                    var id = adaptationSetSwitchingIDs[k];
                    var switchingInfos = acc.adaptationSwitchingInfos[id];
                    if (switchingInfos != null && switchingInfos.newID !== newID &&
                        arrayIncludes(switchingInfos.adaptationSetSwitchingIDs, originalID)) {
                        var adaptationToMergeInto = arrayFind(adaptationsOfTheSameType, function (a) { return a.id === id; });
                        if (adaptationToMergeInto != null &&
                            adaptationToMergeInto.audioDescription ===
                                parsedAdaptationSet.audioDescription &&
                            adaptationToMergeInto.closedCaption ===
                                parsedAdaptationSet.closedCaption &&
                            adaptationToMergeInto.language === parsedAdaptationSet.language) {
                            log.info("DASH Parser: merging \"switchable\" AdaptationSets", originalID, id);
                            (_a = adaptationToMergeInto.representations).push.apply(_a, parsedAdaptationSet.representations);
                            mergedInto = adaptationToMergeInto;
                        }
                    }
                };
                // look if we have to merge this into another Adaptation
                for (var k = 0; k < adaptationSetSwitchingIDs.length; k++) {
                    _loop_1(k);
                }
                if (isMainAdaptation && type === "video") {
                    if (mergedInto == null) {
                        // put "main" adaptation as the first
                        adaptationsOfTheSameType.unshift(parsedAdaptationSet);
                        acc.videoMainAdaptation = parsedAdaptationSet;
                    }
                    else {
                        // put the resulting adaptation first instead
                        var indexOf = adaptationsOfTheSameType.indexOf(mergedInto);
                        if (indexOf < 0) {
                            adaptationsOfTheSameType.unshift(parsedAdaptationSet);
                        }
                        else if (indexOf !== 0) {
                            adaptationsOfTheSameType.splice(indexOf, 1);
                            adaptationsOfTheSameType.unshift(mergedInto);
                        }
                        acc.videoMainAdaptation = mergedInto;
                    }
                }
                else if (mergedInto === null) {
                    adaptationsOfTheSameType.push(parsedAdaptationSet);
                }
            }
        }
        if (originalID != null && acc.adaptationSwitchingInfos[originalID] == null) {
            acc.adaptationSwitchingInfos[originalID] = { newID: newID, adaptationSetSwitchingIDs: adaptationSetSwitchingIDs };
        }
        return {
            adaptations: parsedAdaptations,
            adaptationSwitchingInfos: acc.adaptationSwitchingInfos,
            videoMainAdaptation: acc.videoMainAdaptation,
        };
    }, {
        adaptations: {},
        videoMainAdaptation: null,
        adaptationSwitchingInfos: {},
    }).adaptations;
}

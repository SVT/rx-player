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
import config from "../../../config";
import idGenerator from "../../../utils/id_generator";
import resolveURL, { normalizeBaseURL, } from "../../../utils/resolve_url";
import checkManifestIDs from "../utils/check_manifest_ids";
import getPresentationLiveGap from "./get_presentation_live_gap";
import { createMPDIntermediateRepresentation, } from "./node_parsers/MPD";
import { createPeriodIntermediateRepresentation, } from "./node_parsers/Period";
import parsePeriods from "./parse_periods";
var generateManifestID = idGenerator();
/**
 * @param {Element} root - The MPD root.
 * @param {string} url - The url where the MPD is located
 * @returns {Object}
 */
export default function parseMPD(root, uri) {
    // Transform whole MPD into a parsed JS object representation
    var mpdIR = createMPDIntermediateRepresentation(root);
    return loadExternalRessourcesAndParse(mpdIR, uri);
}
/**
 * Checks if xlinks needs to be loaded before actually parsing the manifest.
 * @param {Object} mpdIR
 * @param {string} uri
 * @returns {Object}
 */
function loadExternalRessourcesAndParse(mpdIR, uri) {
    var xlinksToLoad = [];
    for (var i = 0; i < mpdIR.children.periods.length; i++) {
        var _a = mpdIR.children.periods[i].attributes, xlinkHref = _a.xlinkHref, xlinkActuate = _a.xlinkActuate;
        if (xlinkHref != null && xlinkActuate === "onLoad") {
            xlinksToLoad.push({ index: i, ressource: xlinkHref });
        }
    }
    var utcTimingsToLoad = mpdIR.children.utcTimings.filter(function (utcTiming) {
        return utcTiming.schemeIdUri === 'urn:mpeg:dash:utc:http-iso:2014';
    });
    if (xlinksToLoad.length === 0 && utcTimingsToLoad.length === 0) {
        var parsedManifest = parseCompleteIntermediateRepresentation(mpdIR, uri);
        return { type: "done", value: parsedManifest };
    }
    return {
        type: "needs-ressources",
        value: {
            ressources: xlinksToLoad.map(function (_a) {
                var ressource = _a.ressource;
                return ({ type: 'xlink', url: ressource });
            }).concat(utcTimingsToLoad.map(function (_a) {
                var value = _a.value;
                return ({ type: 'http-iso', url: value || '' });
            })),
            continue: function continueParsingMPD(loadedRessources) {
                var _a;
                if (loadedRessources.length !== (xlinksToLoad.length + utcTimingsToLoad.length)) {
                    throw new Error("DASH parser: wrong number of loaded ressources.");
                }
                // Note: It is important to go from the last index to the first index in
                // the resulting array, as we will potentially add elements to the array
                for (var i = xlinksToLoad.length - 1; i >= 0; i--) {
                    var index = xlinksToLoad[i].index;
                    var xlinkData = loadedRessources[i];
                    var wrappedData = "<root>" + xlinkData + "</root>";
                    var dataAsXML = new DOMParser().parseFromString(wrappedData, "text/xml");
                    if (!dataAsXML || dataAsXML.children.length === 0) {
                        throw new Error("DASH parser: Invalid external ressources");
                    }
                    var periods = dataAsXML.children[0].children;
                    var periodsIR = [];
                    for (var j = 0; j < periods.length; j++) {
                        if (periods[j].nodeType === Node.ELEMENT_NODE) {
                            periodsIR.push(createPeriodIntermediateRepresentation(periods[j]));
                        }
                    }
                    // replace original "xlinked" periods by the real deal
                    (_a = mpdIR.children.periods).splice.apply(_a, [index, 1].concat(periodsIR));
                }
                for (var j = 0; j < utcTimingsToLoad.length; j++) {
                    var utcTiming = utcTimingsToLoad[j];
                    utcTiming.schemeIdUri = 'urn:mpeg:dash:utc:direct:2014';
                    utcTiming.value = loadedRessources[xlinksToLoad.length + j].trim();
                }
                return loadExternalRessourcesAndParse(mpdIR, uri);
            },
        },
    };
}
/**
 * Parse the MPD intermediate representation into a regular Manifest.
 * @param {Object} mpdIR
 * @param {string} uri
 * @returns {Object}
 */
function parseCompleteIntermediateRepresentation(mpdIR, uri) {
    var rootChildren = mpdIR.children, rootAttributes = mpdIR.attributes;
    var baseURL = resolveURL(normalizeBaseURL(uri), rootChildren.baseURL);
    var isDynamic = rootAttributes.type === "dynamic";
    var availabilityStartTime = (rootAttributes.type === "static" ||
        rootAttributes.availabilityStartTime == null) ? 0 : rootAttributes.availabilityStartTime;
    var parsedPeriods = parsePeriods(rootChildren.periods, {
        availabilityStartTime: availabilityStartTime,
        duration: rootAttributes.duration,
        isDynamic: isDynamic,
        baseURL: baseURL,
    });
    var duration = (function () {
        if (rootAttributes.duration != null) {
            return rootAttributes.duration;
        }
        if (isDynamic) {
            return undefined;
        }
        if (parsedPeriods.length) {
            var lastPeriod = parsedPeriods[parsedPeriods.length - 1];
            if (lastPeriod.end != null) {
                return lastPeriod.end;
            }
            else if (lastPeriod.duration != null) {
                return lastPeriod.start + lastPeriod.duration;
            }
        }
        return undefined;
    })();
    var parsedMPD = {
        availabilityStartTime: availabilityStartTime,
        baseURL: baseURL,
        duration: duration,
        id: rootAttributes.id != null ?
            rootAttributes.id : "gen-dash-manifest-" + generateManifestID(),
        periods: parsedPeriods,
        transportType: "dash",
        isLive: isDynamic,
        uris: [uri].concat(rootChildren.locations),
        suggestedPresentationDelay: rootAttributes.suggestedPresentationDelay != null ?
            rootAttributes.suggestedPresentationDelay :
            config.DEFAULT_SUGGESTED_PRESENTATION_DELAY.DASH,
        utcTimings: rootChildren.utcTimings,
    };
    // -- add optional fields --
    if (rootAttributes.type !== "static" && rootAttributes.availabilityEndTime != null) {
        parsedMPD.availabilityEndTime = rootAttributes.availabilityEndTime;
    }
    if (rootAttributes.timeShiftBufferDepth != null) {
        parsedMPD.timeShiftBufferDepth = rootAttributes.timeShiftBufferDepth;
    }
    checkManifestIDs(parsedMPD);
    if (parsedMPD.isLive) {
        parsedMPD.presentationLiveGap = getPresentationLiveGap(parsedMPD);
    }
    return parsedMPD;
}

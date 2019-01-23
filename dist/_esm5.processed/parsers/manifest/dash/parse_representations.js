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
import resolveURL from "../../../utils/resolve_url";
import BaseRepresentationIndex from "./indexes/base";
import ListRepresentationIndex from "./indexes/list";
import TemplateRepresentationIndex from "./indexes/template";
import TimelineRepresentationIndex from "./indexes/timeline";
/**
 * Find and parse RepresentationIndex located in an AdaptationSet node.
 * Returns a generic parsed SegmentTemplate with a single element if not found.
 * @param {Object} adaptation
 * @param {Object} context
 */
function findAdaptationIndex(adaptation, context) {
    var adaptationChildren = adaptation.children;
    var adaptationIndex;
    if (adaptationChildren.segmentBase != null) {
        var segmentBase = adaptationChildren.segmentBase;
        adaptationIndex = new BaseRepresentationIndex(segmentBase, context);
    }
    else if (adaptationChildren.segmentList != null) {
        var segmentList = adaptationChildren.segmentList;
        adaptationIndex = new ListRepresentationIndex(segmentList, context);
    }
    else if (adaptationChildren.segmentTemplate != null) {
        var segmentTemplate = adaptationChildren.segmentTemplate;
        adaptationIndex = segmentTemplate.indexType === "timeline" ?
            new TimelineRepresentationIndex(segmentTemplate, context) :
            new TemplateRepresentationIndex(segmentTemplate, context);
    }
    else {
        adaptationIndex = new TemplateRepresentationIndex({
            duration: Number.MAX_VALUE,
            timescale: 1,
            startNumber: 0,
            initialization: { media: "" },
            media: "",
        }, context);
    }
    return adaptationIndex;
}
/**
 * Process intermediate periods to create final parsed periods.
 * @param {Array.<Object>} periodsIR
 * @param {Object} manifestInfos
 * @returns {Array.<Object>}
 */
export default function parseRepresentations(representationsIR, adaptation, adaptationInfos) {
    return representationsIR.map(function (representation) {
        var baseURL = representation.children.baseURL;
        var representationBaseURL = resolveURL(adaptationInfos.baseURL, baseURL);
        // 4-2-1. Find Index
        var context = {
            periodStart: adaptationInfos.start,
            periodEnd: adaptationInfos.end,
            isDynamic: adaptationInfos.isDynamic,
            representationBaseURL: representationBaseURL,
            representationId: representation.attributes.id,
            representationBitrate: representation.attributes.bitrate,
        };
        var representationIndex;
        if (representation.children.segmentBase != null) {
            var segmentBase = representation.children.segmentBase;
            representationIndex = new BaseRepresentationIndex(segmentBase, context);
        }
        else if (representation.children.segmentList != null) {
            var segmentList = representation.children.segmentList;
            representationIndex = new ListRepresentationIndex(segmentList, context);
        }
        else if (representation.children.segmentTemplate != null) {
            var segmentTemplate = representation.children.segmentTemplate;
            representationIndex = segmentTemplate.indexType === "timeline" ?
                new TimelineRepresentationIndex(segmentTemplate, context) :
                new TemplateRepresentationIndex(segmentTemplate, context);
        }
        else {
            representationIndex = findAdaptationIndex(adaptation, context);
        }
        // 4-2-2. Find bitrate
        var representationBitrate;
        if (representation.attributes.bitrate == null) {
            log.warn("DASH: No usable bitrate found in the Representation.");
            representationBitrate = 0;
        }
        else {
            representationBitrate = representation.attributes.bitrate;
        }
        // 4-2-3. Set ID
        var representationID = representation.attributes.id != null ?
            representation.attributes.id :
            (representation.attributes.bitrate +
                (representation.attributes.height != null ?
                    ("-" + representation.attributes.height) : "") +
                (representation.attributes.width != null ?
                    ("-" + representation.attributes.width) : "") +
                (representation.attributes.mimeType != null ?
                    ("-" + representation.attributes.mimeType) : "") +
                (representation.attributes.codecs != null ?
                    ("-" + representation.attributes.codecs) : ""));
        // 4-2-4. Construct Representation Base
        var parsedRepresentation = {
            bitrate: representationBitrate,
            index: representationIndex,
            id: representationID,
        };
        // 4-2-5. Add optional attributes
        var codecs;
        if (representation.attributes.codecs != null) {
            codecs = representation.attributes.codecs;
        }
        else if (adaptation.attributes.codecs != null) {
            codecs = adaptation.attributes.codecs;
        }
        if (codecs != null) {
            codecs = codecs === "mp4a.40.02" ? "mp4a.40.2" : codecs;
            parsedRepresentation.codecs = codecs;
        }
        if (representation.attributes.frameRate != null) {
            parsedRepresentation.frameRate =
                representation.attributes.frameRate;
        }
        else if (adaptation.attributes.frameRate != null) {
            parsedRepresentation.frameRate =
                adaptation.attributes.frameRate;
        }
        if (representation.attributes.height != null) {
            parsedRepresentation.height =
                representation.attributes.height;
        }
        else if (adaptation.attributes.height != null) {
            parsedRepresentation.height =
                adaptation.attributes.height;
        }
        if (representation.attributes.mimeType != null) {
            parsedRepresentation.mimeType =
                representation.attributes.mimeType;
        }
        else if (adaptation.attributes.mimeType != null) {
            parsedRepresentation.mimeType =
                adaptation.attributes.mimeType;
        }
        if (representation.attributes.width != null) {
            parsedRepresentation.width =
                representation.attributes.width;
        }
        else if (adaptation.attributes.width != null) {
            parsedRepresentation.width =
                adaptation.attributes.width;
        }
        if (adaptation.children.contentProtections) {
            var contentProtections = [];
            for (var k = 0; k < adaptation.children.contentProtections.length; k++) {
                var protection = adaptation.children.contentProtections[k];
                if (protection.keyId != null) {
                    contentProtections.push({ keyId: protection.keyId });
                }
            }
            if (contentProtections.length) {
                parsedRepresentation.contentProtections = contentProtections;
            }
        }
        return parsedRepresentation;
    });
}

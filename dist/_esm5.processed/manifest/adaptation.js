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
import { MediaError, } from "../errors";
import log from "../log";
import arrayFind from "../utils/array_find";
import normalizeLanguage from "../utils/languages";
import uniq from "../utils/uniq";
import filterSupportedRepresentations from "./filter_supported_representations";
import Representation from "./representation";
export var SUPPORTED_ADAPTATIONS_TYPE = ["audio", "video", "text", "image"];
/**
 * Normalized Adaptation structure.
 * An Adaptation describes a single `Track`. For example a specific audio
 * track (in a given language) or a specific video track.
 * It istelf can be represented in different qualities, which we call here
 * `Representation`.
 * @class Adaptation
 */
var Adaptation = /** @class */ (function () {
    /**
     * @constructor
     * @param {Object} args
     * @param {Function|undefined} [representationFilter]
     */
    function Adaptation(args, representationFilter) {
        var _this = this;
        this.parsingErrors = [];
        this.id = args.id;
        this.type = args.type;
        var hadRepresentations = !!args.representations.length;
        var argsRepresentations = filterSupportedRepresentations(args.type, args.representations);
        if (hadRepresentations && argsRepresentations.length === 0) {
            log.warn("Incompatible codecs for adaptation", args);
            var error = new MediaError("MANIFEST_INCOMPATIBLE_CODECS_ERROR", null, false);
            this.parsingErrors.push(error);
        }
        if (args.language != null) {
            this.language = args.language;
            this.normalizedLanguage = normalizeLanguage(args.language);
        }
        if (args.closedCaption != null) {
            this.isClosedCaption = args.closedCaption;
        }
        if (args.audioDescription != null) {
            this.isAudioDescription = args.audioDescription;
        }
        this.representations = argsRepresentations
            .map(function (representation) { return new Representation(representation); })
            .sort(function (a, b) { return a.bitrate - b.bitrate; })
            .filter(function (representation) {
            if (representationFilter == null) {
                return true;
            }
            return representationFilter(representation, {
                bufferType: _this.type,
                language: _this.language,
                normalizedLanguage: _this.normalizedLanguage,
                isClosedCaption: _this.isClosedCaption,
                isAudioDescription: _this.isAudioDescription,
            });
        });
        // for manuallyAdded adaptations (not in the manifest)
        this.manuallyAdded = !!args.manuallyAdded;
    }
    /**
     * Returns unique bitrate for every Representation in this Adaptation.
     * @returns {Array.<Number>}
     */
    Adaptation.prototype.getAvailableBitrates = function () {
        var bitrates = this.representations
            .map(function (representation) { return representation.bitrate; });
        return uniq(bitrates);
    };
    /**
     * Returns the Representation linked to the given ID.
     * @param {number|string} wantedId
     * @returns {Object|undefined}
     */
    Adaptation.prototype.getRepresentation = function (wantedId) {
        return arrayFind(this.representations, function (_a) {
            var id = _a.id;
            return wantedId === id;
        });
    };
    return Adaptation;
}());
export default Adaptation;

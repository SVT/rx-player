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
import arrayIncludes from "../utils/array_includes";
import objectValues from "../utils/object_values";
import Adaptation, { SUPPORTED_ADAPTATIONS_TYPE, } from "./adaptation";
/**
 * Class representing a single `Period` of the Manifest.
 * A Period contains every informations about the content available for a
 * specific period in time.
 * @class Period
 */
var Period = /** @class */ (function () {
    /**
     * @constructor
     * @param {Object} args
     * @param {function|undefined} [representationFilter]
     */
    function Period(args, representationFilter) {
        var _this = this;
        this.parsingErrors = [];
        this.id = args.id;
        this.adaptations = Object.keys(args.adaptations)
            .reduce(function (acc, type) {
            var adaptationsForType = args.adaptations[type];
            if (!adaptationsForType) {
                return acc;
            }
            var filteredAdaptations = adaptationsForType
                .filter(function (adaptation) {
                if (!arrayIncludes(SUPPORTED_ADAPTATIONS_TYPE, adaptation.type)) {
                    log.info("not supported adaptation type", adaptation.type);
                    var error = new MediaError("MANIFEST_UNSUPPORTED_ADAPTATION_TYPE", "An Adaptation has an unknown and unsupported type: " +
                        adaptation.type, false);
                    _this.parsingErrors.push(error);
                    return false;
                }
                else {
                    return true;
                }
            })
                .map(function (adaptation) {
                var _a;
                var newAdaptation = new Adaptation(adaptation, representationFilter);
                (_a = _this.parsingErrors).push.apply(_a, newAdaptation.parsingErrors);
                return newAdaptation;
            })
                .filter(function (adaptation) { return adaptation.representations.length; });
            if (filteredAdaptations.length === 0 &&
                adaptationsForType.length > 0 &&
                (type === "video" || type === "audio")) {
                throw new MediaError("MANIFEST_PARSE_ERROR", "No supported " + type + " adaptations", true);
            }
            if (filteredAdaptations.length) {
                acc[type] = filteredAdaptations;
            }
            return acc;
        }, {});
        if (!this.adaptations.video && !this.adaptations.audio) {
            throw new MediaError("MANIFEST_PARSE_ERROR", "No supported audio and video tracks.", true);
        }
        this.duration = args.duration;
        this.start = args.start;
        if (this.duration != null && this.start != null) {
            this.end = this.start + this.duration;
        }
    }
    /**
     * Returns every `Adaptations` (or `tracks`) linked to that Period, in an
     * Array.
     * @returns {Array.<Object>}
     */
    Period.prototype.getAdaptations = function () {
        var adaptationsByType = this.adaptations;
        return objectValues(adaptationsByType)
            .reduce(function (acc, adaptations) {
            // Note: the second case cannot happen. TS is just being dumb here
            return adaptations != null ? acc.concat(adaptations) : acc;
        }, []);
    };
    /**
     * Returns every `Adaptations` (or `tracks`) linked to that Period for a
     * given type.
     * @param {string} adaptationType
     * @returns {Array.<Object>}
     */
    Period.prototype.getAdaptationsForType = function (adaptationType) {
        return this.adaptations[adaptationType] || [];
    };
    /**
     * Returns the Adaptation linked to the given ID.
     * @param {number|string} wantedId
     * @returns {Object|undefined}
     */
    Period.prototype.getAdaptation = function (wantedId) {
        return arrayFind(this.getAdaptations(), function (_a) {
            var id = _a.id;
            return wantedId === id;
        });
    };
    return Period;
}());
export default Period;

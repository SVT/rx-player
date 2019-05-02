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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import log from "../log";
import arrayFind from "../utils/array_find";
import EventEmitter from "../utils/event_emitter";
import idGenerator from "../utils/id_generator";
import warnOnce from "../utils/warn_once";
import Adaptation from "./adaptation";
import Period from "./period";
import { StaticRepresentationIndex } from "./representation_index";
import updatePeriodInPlace from "./update_period";
var generateNewId = idGenerator();
/**
 * Normalized Manifest structure.
 * @class Manifest
 */
var Manifest = /** @class */ (function (_super) {
    __extends(Manifest, _super);
    /**
     * @constructor
     * @param {Object} args
     */
    function Manifest(args, options) {
        var _this = _super.call(this) || this;
        var _a = options.supplementaryTextTracks, supplementaryTextTracks = _a === void 0 ? [] : _a, _b = options.supplementaryImageTracks, supplementaryImageTracks = _b === void 0 ? [] : _b, representationFilter = options.representationFilter;
        _this.parsingErrors = [];
        _this.id = args.id;
        _this.transport = args.transportType;
        _this._clockOffset = args.clockOffset;
        _this.periods = args.periods.map(function (period) {
            var _a;
            var parsedPeriod = new Period(period, representationFilter);
            (_a = _this.parsingErrors).push.apply(_a, parsedPeriod.parsingErrors);
            return parsedPeriod;
        }).sort(function (a, b) { return a.start - b.start; });
        /**
         * @deprecated It is here to ensure compatibility with the way the
         * v3.x.x manages adaptations at the Manifest level
         */
        /* tslint:disable:deprecation */
        _this.adaptations = (_this.periods[0] && _this.periods[0].adaptations) || {};
        /* tslint:enable:deprecation */
        _this.minimumTime = args.minimumTime;
        _this.isLive = args.isLive;
        _this.uris = args.uris || [];
        _this.lifetime = args.lifetime;
        _this.suggestedPresentationDelay = args.suggestedPresentationDelay;
        _this.availabilityStartTime = args.availabilityStartTime;
        _this.presentationLiveGap = args.presentationLiveGap;
        _this.timeShiftBufferDepth = args.timeShiftBufferDepth;
        _this.baseURL = args.baseURL;
        if (!args.isLive && args.duration == null) {
            log.warn("Manifest: non live content and duration is null.");
        }
        _this._duration = args.duration;
        if (supplementaryImageTracks.length) {
            _this.addSupplementaryImageAdaptations(supplementaryImageTracks);
        }
        if (supplementaryTextTracks.length) {
            _this.addSupplementaryTextAdaptations(supplementaryTextTracks);
        }
        return _this;
    }
    /**
     * Returns Period encountered at the given time.
     * Returns undefined if there is no Period exactly at the given time.
     * @param {number} time
     * @returns {Period|undefined}
     */
    Manifest.prototype.getPeriodForTime = function (time) {
        return arrayFind(this.periods, function (period) {
            return time >= period.start &&
                (period.end == null || period.end > time);
        });
    };
    /**
     * Returns period coming just after a given period.
     * Returns undefined if not found.
     * @param {Period} period
     * @returns {Period|null}
     */
    Manifest.prototype.getPeriodAfter = function (period) {
        var endOfPeriod = period.end;
        if (endOfPeriod == null) {
            return null;
        }
        return arrayFind(this.periods, function (_period) {
            return _period.end == null || endOfPeriod < _period.end;
        }) || null;
    };
    /**
     * Returns the duration of the whole content described by that Manifest.
     * @returns {Number}
     */
    Manifest.prototype.getDuration = function () {
        return this._duration;
    };
    /**
     * Returns the most important URL from which the Manifest can be refreshed.
     * @returns {string|undefined}
     */
    Manifest.prototype.getUrl = function () {
        return this.uris[0];
    };
    /**
     * @deprecated only returns adaptations for the first period
     * @returns {Array.<Object>}
     */
    Manifest.prototype.getAdaptations = function () {
        warnOnce("manifest.getAdaptations() is deprecated." +
            " Please use manifest.period[].getAdaptations() instead");
        var firstPeriod = this.periods[0];
        if (!firstPeriod) {
            return [];
        }
        var adaptationsByType = firstPeriod.adaptations;
        var adaptationsList = [];
        for (var adaptationType in adaptationsByType) {
            if (adaptationsByType.hasOwnProperty(adaptationType)) {
                var adaptations = adaptationsByType[adaptationType];
                adaptationsList.push.apply(adaptationsList, adaptations);
            }
        }
        return adaptationsList;
    };
    /**
     * @deprecated only returns adaptations for the first period
     * @returns {Array.<Object>}
     */
    Manifest.prototype.getAdaptationsForType = function (adaptationType) {
        warnOnce("manifest.getAdaptationsForType(type) is deprecated." +
            " Please use manifest.period[].getAdaptationsForType(type) instead");
        var firstPeriod = this.periods[0];
        if (!firstPeriod) {
            return [];
        }
        return firstPeriod.adaptations[adaptationType] || [];
    };
    /**
     * @deprecated only returns adaptations for the first period
     * @returns {Array.<Object>}
     */
    Manifest.prototype.getAdaptation = function (wantedId) {
        warnOnce("manifest.getAdaptation(id) is deprecated." +
            " Please use manifest.period[].getAdaptation(id) instead");
        /* tslint:disable:deprecation */
        return arrayFind(this.getAdaptations(), function (_a) {
            var id = _a.id;
            return wantedId === id;
        });
        /* tslint:enable:deprecation */
    };
    /**
     * Update the current manifest properties
     * @param {Object} Manifest
     */
    Manifest.prototype.update = function (newManifest) {
        var _a;
        this._duration = newManifest.getDuration();
        /* tslint:disable:deprecation */
        this.adaptations = newManifest.adaptations;
        /* tslint:enable:deprecation */
        this.availabilityStartTime = newManifest.availabilityStartTime;
        this.baseURL = newManifest.baseURL;
        this.id = newManifest.id;
        this.isLive = newManifest.isLive;
        this.lifetime = newManifest.lifetime;
        this.minimumTime = newManifest.minimumTime;
        this.parsingErrors = newManifest.parsingErrors;
        this.presentationLiveGap = newManifest.presentationLiveGap;
        this.suggestedPresentationDelay = newManifest.suggestedPresentationDelay;
        this.timeShiftBufferDepth = newManifest.timeShiftBufferDepth;
        this.transport = newManifest.transport;
        this.uris = newManifest.uris;
        var oldPeriods = this.periods;
        var newPeriods = newManifest.periods;
        var oldPeriodCounter = 0;
        var newPeriodCounter = 0;
        // 2 - Update Periods in both Manifests
        while (oldPeriodCounter < oldPeriods.length) {
            var newPeriod = newPeriods[newPeriodCounter];
            var oldPeriod = oldPeriods[oldPeriodCounter];
            if (newPeriod == null) {
                log.info("Manifest: Period " + oldPeriod.id + " not found after update. Removing.");
                oldPeriods.splice(oldPeriodCounter, 1);
                oldPeriodCounter--;
            }
            else if (newPeriod.id === oldPeriod.id) {
                updatePeriodInPlace(oldPeriod, newPeriod);
            }
            else {
                log.info("Manifest: Adding new Period " + newPeriod.id + " after update.");
                this.periods.splice(oldPeriodCounter, 0, newPeriod);
            }
            oldPeriodCounter++;
            newPeriodCounter++;
        }
        // adding - perhaps - new Period[s]
        if (newPeriodCounter < newPeriods.length) {
            log.info("Manifest: Adding new periods after update.");
            (_a = this.periods).push.apply(_a, newPeriods.slice(newPeriodCounter));
        }
        this.trigger("manifestUpdate", null);
    };
    /**
     * Get minimum position currently defined by the Manifest, in seconds.
     * @returns {number}
     */
    Manifest.prototype.getMinimumPosition = function () {
        // we have to know both the min and the max to be sure
        var min = this.getCurrentPositionLimits()[0];
        return min;
    };
    /**
     * Get maximum position currently defined by the Manifest, in seconds.
     * @returns {number}
     */
    Manifest.prototype.getMaximumPosition = function () {
        if (!this.isLive) {
            var duration = this.getDuration();
            return duration == null ? Infinity : duration;
        }
        var ast = this.availabilityStartTime || 0;
        var plg = this.presentationLiveGap || 0;
        var now = Date.now() - (this._clockOffset || 0);
        return (now / 1000) - ast - plg;
    };
    /**
     * Get minimum AND maximum positions currently defined by the manifest, in
     * seconds.
     * @returns {Array.<number>}
     */
    Manifest.prototype.getCurrentPositionLimits = function () {
        // TODO use RTT for the manifest request? (+ 3 or something)
        var BUFFER_DEPTH_SECURITY = 5;
        var minimumTime = this.minimumTime != null ? this.minimumTime : 0;
        if (!this.isLive) {
            var duration = this.getDuration();
            var maximumTime = duration == null ? Infinity : duration;
            return [minimumTime, maximumTime];
        }
        var ast = this.availabilityStartTime || 0;
        var plg = this.presentationLiveGap || 0;
        var tsbd = this.timeShiftBufferDepth || 0;
        var now = Date.now() - (this._clockOffset || 0);
        var max = (now / 1000) - ast - plg;
        return [
            Math.min(max, Math.max(minimumTime, max - tsbd + BUFFER_DEPTH_SECURITY)),
            max,
        ];
    };
    /**
     * If true, this Manifest is currently synchronized with the server's clock.
     * @returns {Boolean}
     */
    Manifest.prototype.hasClockSynchronization = function () {
        return this._clockOffset != null;
    };
    /**
     * Add supplementary image Adaptation(s) to the manifest.
     * @private
     * @param {Object|Array.<Object>} imageTracks
     */
    Manifest.prototype.addSupplementaryImageAdaptations = function (imageTracks) {
        var _this = this;
        var _imageTracks = Array.isArray(imageTracks) ? imageTracks : [imageTracks];
        var newImageTracks = _imageTracks.map(function (_a) {
            var _b;
            var mimeType = _a.mimeType, url = _a.url;
            var adaptationID = "gen-image-ada-" + generateNewId();
            var representationID = "gen-image-rep-" + generateNewId();
            var newAdaptation = new Adaptation({
                id: adaptationID,
                type: "image",
                manuallyAdded: true,
                representations: [{
                        bitrate: 0,
                        id: representationID,
                        mimeType: mimeType,
                        index: new StaticRepresentationIndex({ media: url }),
                    }],
            });
            (_b = _this.parsingErrors).push.apply(_b, newAdaptation.parsingErrors);
            return newAdaptation;
        });
        if (newImageTracks.length && this.periods.length) {
            var adaptations = this.periods[0].adaptations;
            adaptations.image = adaptations.image ?
                adaptations.image.concat(newImageTracks) : newImageTracks;
        }
    };
    /**
     * Add supplementary text Adaptation(s) to the manifest.
     * @private
     * @param {Object|Array.<Object>} textTracks
     */
    Manifest.prototype.addSupplementaryTextAdaptations = function (textTracks) {
        var _this = this;
        var _textTracks = Array.isArray(textTracks) ? textTracks : [textTracks];
        var newTextAdaptations = _textTracks.reduce(function (allSubs, _a) {
            var mimeType = _a.mimeType, codecs = _a.codecs, url = _a.url, language = _a.language, languages = _a.languages, closedCaption = _a.closedCaption;
            var langsToMapOn = language ? [language] : languages || [];
            return allSubs.concat(langsToMapOn.map(function (_language) {
                var _a;
                var adaptationID = "gen-text-ada-" + generateNewId();
                var representationID = "gen-text-rep-" + generateNewId();
                var newAdaptation = new Adaptation({
                    id: adaptationID,
                    type: "text",
                    language: _language,
                    closedCaption: closedCaption,
                    manuallyAdded: true,
                    representations: [{
                            bitrate: 0,
                            id: representationID,
                            mimeType: mimeType,
                            codecs: codecs,
                            index: new StaticRepresentationIndex({ media: url }),
                        }],
                });
                (_a = _this.parsingErrors).push.apply(_a, newAdaptation.parsingErrors);
                return newAdaptation;
            }));
        }, []);
        if (newTextAdaptations.length && this.periods.length) {
            var adaptations = this.periods[0].adaptations;
            adaptations.text = adaptations.text ?
                adaptations.text.concat(newTextAdaptations) : newTextAdaptations;
        }
    };
    return Manifest;
}(EventEmitter));
export default Manifest;

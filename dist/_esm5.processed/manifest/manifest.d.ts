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
import { ICustomError } from "../errors";
import EventEmitter from "../utils/event_emitter";
import Adaptation, { IAdaptationType, IRepresentationFilter } from "./adaptation";
import Period, { IPeriodArguments } from "./period";
declare type ManifestAdaptations = Partial<Record<IAdaptationType, Adaptation[]>>;
interface ISupplementaryImageTrack {
    mimeType: string;
    url: string;
}
interface ISupplementaryTextTrack {
    mimeType: string;
    codecs?: string;
    url: string;
    language?: string;
    languages?: string[];
    closedCaption: boolean;
}
interface IManifestArguments {
    id: string;
    isLive: boolean;
    periods: IPeriodArguments[];
    transportType: string;
    availabilityStartTime?: number;
    baseURL?: string;
    duration?: number;
    lifetime?: number;
    minimumTime?: number;
    presentationLiveGap?: number;
    suggestedPresentationDelay?: number;
    timeShiftBufferDepth?: number;
    uris?: string[];
    clockOffset?: number;
}
interface IManifestParsingOptions {
    supplementaryTextTracks?: ISupplementaryTextTrack[];
    supplementaryImageTracks?: ISupplementaryImageTrack[];
    representationFilter?: IRepresentationFilter;
}
export interface IManifestEvents {
    manifestUpdate: null;
}
/**
 * Normalized Manifest structure.
 * @class Manifest
 */
export default class Manifest extends EventEmitter<IManifestEvents> {
    /**
     * ID uniquely identifying this Manifest.
     * @type {string}
     */
    id: string;
    /**
     * Type of transport used by this Manifest (e.g. `"dash"` or `"smooth"`.
     * @type {string}
     */
    transport: string;
    /**
     * Every `Adaptations` for the first `Period` of the Manifest.
     * Deprecated. Please use manifest.periods[0].adaptations instead.
     * @deprecated
     * @type {Object}
     */
    adaptations: ManifestAdaptations;
    /**
     * List every `Period` in that Manifest chronologically (from its start time).
     * A `Period` contains content informations about the content available for
     * a specific period in time.
     * @type {Array.<Object>}
     */
    readonly periods: Period[];
    /**
     * If true, this Manifest describes a content still running live.
     * If false, this Manifest describes a finished content.
     * At the moment this specificity cannot change with time.
     * TODO Handle that case?
     * @type {Boolean}
     */
    isLive: boolean;
    /**
     * Every URI linking to that Manifest, used for refreshing it.
     * Listed from the most important to the least important.
     * @type {Array.<string>}
     */
    uris: string[];
    /**
     * Suggested delay from the "live edge" the content is suggested to start
     * from.
     * This only applies to live contents.
     * @type {number|undefined}
     */
    suggestedPresentationDelay?: number;
    /**
     * Base URL from which relative segment's URLs will be relative to.
     * @param {string}
     */
    baseURL?: string;
    /**
     * Amount of time, in seconds, this Manifest is valid from its fetching time.
     * If not valid, you will need to refresh and update this Manifest (the latter
     * can be done through the `update` method).
     * If no lifetime is set, this Manifest does not become invalid after an
     * amount of time.
     * @type {number|undefined}
     */
    lifetime?: number;
    /**
     * Minimum time, in seconds, at which the segment defined in the Manifest
     * begins.
     * @type {number|undefined}
     */
    availabilityStartTime?: number;
    /**
     * Minimum time in this Manifest we can seek to, in seconds.
     * @type {number|undefined}
     */
    minimumTime?: number;
    /**
     * Estimated difference between Date.now() and the real live edge of the
     * content.
     * Note: this is sometimes really hard to estimate.
     * @type {number|undefined}
     */
    presentationLiveGap?: number;
    /**
     * Time - relative to the last available position - in seconds from when
     * the first segment is available.
     * Every segments before that time can be considered as unavailable.
     * This is also sometimes called the `TimeShift window`.
     * @type {number|undefined}
     */
    timeShiftBufferDepth?: number;
    /**
     * Array containing every errors that happened when the Manifest has been
     * created, in the order they have happened.
     * @type {Array.<Error>}
     */
    parsingErrors: Array<Error | ICustomError>;
    /**
     * Whole duration anounced in the Manifest.
     * @private
     * @type {number}
     */
    private _duration;
    private _clockOffset;
    /**
     * @constructor
     * @param {Object} args
     */
    constructor(args: IManifestArguments, options: IManifestParsingOptions);
    /**
     * Returns Period encountered at the given time.
     * Returns undefined if there is no Period exactly at the given time.
     * @param {number} time
     * @returns {Period|undefined}
     */
    getPeriodForTime(time: number): Period | undefined;
    /**
     * Returns period coming just after a given period.
     * Returns undefined if not found.
     * @param {Period} period
     * @returns {Period|null}
     */
    getPeriodAfter(period: Period): Period | null;
    /**
     * Returns the duration of the whole content described by that Manifest.
     * @returns {Number}
     */
    getDuration(): number | undefined;
    /**
     * Returns the most important URL from which the Manifest can be refreshed.
     * @returns {string|undefined}
     */
    getUrl(): string | undefined;
    /**
     * @deprecated only returns adaptations for the first period
     * @returns {Array.<Object>}
     */
    getAdaptations(): Adaptation[];
    /**
     * @deprecated only returns adaptations for the first period
     * @returns {Array.<Object>}
     */
    getAdaptationsForType(adaptationType: IAdaptationType): Adaptation[];
    /**
     * @deprecated only returns adaptations for the first period
     * @returns {Array.<Object>}
     */
    getAdaptation(wantedId: number | string): Adaptation | undefined;
    /**
     * Update the current manifest properties
     * @param {Object} Manifest
     */
    update(newManifest: Manifest): void;
    /**
     * Get minimum position currently defined by the Manifest, in seconds.
     * @returns {number}
     */
    getMinimumPosition(): number;
    /**
     * Get maximum position currently defined by the Manifest, in seconds.
     * @returns {number}
     */
    getMaximumPosition(): number;
    /**
     * Get minimum AND maximum positions currently defined by the manifest, in
     * seconds.
     * @returns {Array.<number>}
     */
    getCurrentPositionLimits(): [number, number];
    /**
     * If true, this Manifest is currently synchronized with the server's clock.
     * @returns {Boolean}
     */
    hasClockSynchronization(): boolean;
    /**
     * Add supplementary image Adaptation(s) to the manifest.
     * @private
     * @param {Object|Array.<Object>} imageTracks
     */
    private addSupplementaryImageAdaptations;
    /**
     * Add supplementary text Adaptation(s) to the manifest.
     * @private
     * @param {Object|Array.<Object>} textTracks
     */
    private addSupplementaryTextAdaptations;
}
export { IManifestArguments, IManifestParsingOptions, ISupplementaryImageTrack, ISupplementaryTextTrack, };

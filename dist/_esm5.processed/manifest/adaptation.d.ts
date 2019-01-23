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
import Representation, { IRepresentationArguments } from "./representation";
export declare type IAdaptationType = "video" | "audio" | "text" | "image";
export declare const SUPPORTED_ADAPTATIONS_TYPE: IAdaptationType[];
export interface IRepresentationInfos {
    bufferType: IAdaptationType;
    language?: string;
    isAudioDescription?: boolean;
    isClosedCaption?: boolean;
    normalizedLanguage?: string;
}
export declare type IRepresentationFilter = (representation: Representation, adaptationInfos: IRepresentationInfos) => boolean;
export interface IAdaptationArguments {
    id: string;
    representations: IRepresentationArguments[];
    type: IAdaptationType;
    audioDescription?: boolean;
    closedCaption?: boolean;
    language?: string;
    manuallyAdded?: boolean;
}
/**
 * Normalized Adaptation structure.
 * An Adaptation describes a single `Track`. For example a specific audio
 * track (in a given language) or a specific video track.
 * It istelf can be represented in different qualities, which we call here
 * `Representation`.
 * @class Adaptation
 */
export default class Adaptation {
    /**
     * ID uniquely identifying the Adaptation in the Period.
     * TODO in the Manifest instead?
     * @type {string}
     */
    readonly id: string;
    /**
     * Different `Representations` (e.g. qualities) this Adaptation is available
     * in.
     * @type {Array.<Object>}
     */
    readonly representations: Representation[];
    /**
     * Type of this Adaptation.
     * @type {string}
     */
    readonly type: IAdaptationType;
    /**
     * Whether this track contains an audio description for the visually impaired.
     * @type {Boolean}
     */
    isAudioDescription?: boolean;
    /**
     * Whether this Adaptation contains closed captions for the hard-of-hearing.
     * @type {Boolean}
     */
    isClosedCaption?: boolean;
    /**
     * Language this Adaptation is in, as announced in the original Manifest.
     * @type {string|undefined}
     */
    language?: string;
    /**
     * Language this Adaptation is in, when translated into an ISO639-3 code.
     * @type {string|undefined}
     */
    normalizedLanguage?: string;
    /**
     * `true` if this Adaptation was not present in the original Manifest, but was
     * manually added after through the corresponding APIs.
     * @type {boolean}
     */
    manuallyAdded: boolean;
    /**
     * Array containing every errors that happened when the Adaptation has been
     * created, in the order they have happened.
     * @type {Array.<Error>}
     */
    readonly parsingErrors: Array<Error | ICustomError>;
    /**
     * @constructor
     * @param {Object} args
     * @param {Function|undefined} [representationFilter]
     */
    constructor(args: IAdaptationArguments, representationFilter?: IRepresentationFilter);
    /**
     * Returns unique bitrate for every Representation in this Adaptation.
     * @returns {Array.<Number>}
     */
    getAvailableBitrates(): number[];
    /**
     * Returns the Representation linked to the given ID.
     * @param {number|string} wantedId
     * @returns {Object|undefined}
     */
    getRepresentation(wantedId: number | string): Representation | undefined;
}

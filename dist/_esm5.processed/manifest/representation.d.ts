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
import IRepresentationIndex from "./representation_index";
interface IContentProtection {
    keyId?: string;
    systemId?: string;
}
export interface IRepresentationArguments {
    bitrate: number;
    id: string;
    index: IRepresentationIndex;
    codecs?: string;
    contentProtections?: IContentProtection[];
    frameRate?: string;
    height?: number;
    mimeType?: string;
    width?: number;
}
/**
 * Normalized Representation structure.
 * @class Representation
 */
declare class Representation {
    /**
     * ID uniquely identifying the Representation in the Adaptation.
     * TODO unique for the whole manifest?
     * @type {string}
     */
    readonly id: string | number;
    /**
     * Interface allowing to request segments for specific times.
     * @type {Object}
     */
    index: IRepresentationIndex;
    /**
     * Bitrate this Representation is in, in bits per seconds.
     * @type {number}
     */
    bitrate: number;
    /**
     * Frame-rate, when it can be applied, of this Representation, in any textual
     * indication possible (often under a ratio form).
     * @type {string}
     */
    frameRate?: string;
    codec?: string;
    mimeType?: string;
    width?: number;
    height?: number;
    /**
     * DRM Informations for this Representation.
     * @type {Array.<Object>}
     */
    contentProtections?: IContentProtection[];
    /**
     * @constructor
     * @param {Object} args
     */
    constructor(args: IRepresentationArguments);
    /**
     * Returns "mime-type string" which includes both the mime-type and the codec,
     * which is often needed when interacting with the browser's APIs.
     * @returns {string}
     */
    getMimeTypeString(): string;
}
export default Representation;

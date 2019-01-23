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
import { IRepresentationIndex, ISegment } from "../../../../manifest";
import { IIndexSegment } from "./helpers";
export interface IBaseIndex {
    duration?: number;
    indexRange?: [number, number];
    indexTimeOffset: number;
    initialization?: {
        mediaURL: string;
        range?: [number, number];
    };
    mediaURL: string;
    startNumber?: number;
    timeline: IIndexSegment[];
    timelineEnd: number | undefined;
    timescale: number;
}
export interface IBaseIndexIndexArgument {
    timeline: IIndexSegment[];
    timescale: number;
    duration?: number;
    media?: string;
    indexRange?: [number, number];
    initialization?: {
        media?: string;
        range?: [number, number];
    };
    startNumber?: number;
    presentationTimeOffset?: number;
}
export interface IBaseIndexContextArgument {
    periodStart: number;
    periodEnd: number | undefined;
    representationBaseURL: string;
    representationId?: string;
    representationBitrate?: number;
}
/**
 * Provide helpers for SegmentBase-based indexes.
 * @type {Object}
 */
export default class BaseRepresentationIndex implements IRepresentationIndex {
    private _index;
    /**
     * @param {Object} index
     * @param {Object} context
     */
    constructor(index: IBaseIndexIndexArgument, context: IBaseIndexContextArgument);
    /**
     * Construct init Segment.
     * @returns {Object}
     */
    getInitSegment(): ISegment;
    /**
     * @param {Number} _up
     * @param {Number} _to
     * @returns {Array.<Object>}
     */
    getSegments(_up: number, _to: number): ISegment[];
    /**
     * Returns false as no Segment-Base based index should need to be refreshed.
     * @returns {Boolean}
     */
    shouldRefresh(): false;
    /**
     * Returns first position in index.
     * @returns {Number|undefined}
     */
    getFirstPosition(): number | undefined;
    /**
     * Returns last position in index.
     * @returns {Number|undefined}
     */
    getLastPosition(): number | undefined;
    /**
     * We do not check for discontinuity in SegmentBase-based indexes.
     * @returns {Number}
     */
    checkDiscontinuity(): -1;
    /**
     * @param {Array.<Object>} nextSegments
     * @returns {Array.<Object>}
     */
    _addSegments(nextSegments: Array<{
        time: number;
        duration: number;
        timescale: number;
        count?: number;
        range?: [number, number];
    }>): void;
    /**
     * @param {Object} newIndex
     */
    _update(newIndex: BaseRepresentationIndex): void;
}

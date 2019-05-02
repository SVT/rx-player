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
export interface IListIndex {
    timescale: number;
    duration: number;
    list: Array<{
        mediaURL: string;
        mediaRange?: [number, number];
    }>;
    indexTimeOffset: number;
    initialization?: {
        mediaURL: string;
        range?: [number, number];
    };
    indexRange?: [number, number];
}
export interface IListIndexIndexArgument {
    duration: number;
    list: Array<{
        media?: string;
        mediaRange?: [number, number];
    }>;
    timescale: number;
    indexRange?: [number, number];
    initialization?: {
        media?: string;
        range?: [number, number];
    };
    presentationTimeOffset?: number;
}
export interface IListIndexContextArgument {
    periodStart: number;
    representationBaseURL: string;
    representationId?: string;
    representationBitrate?: number;
}
/**
 * Provide helpers for SegmentList-based DASH indexes.
 * @type {Object}
 */
export default class ListRepresentationIndex implements IRepresentationIndex {
    protected _periodStart: number;
    private _index;
    /**
     * @param {Object} index
     * @param {Object} context
     */
    constructor(index: IListIndexIndexArgument, context: IListIndexContextArgument);
    /**
     * Construct init Segment.
     * @returns {Object}
     */
    getInitSegment(): ISegment;
    /**
     * @param {Number} fromTime
     * @param {Number} duration
     * @returns {Array.<Object>}
     */
    getSegments(fromTime: number, dur: number): ISegment[];
    /**
     * Returns true if, based on the arguments, the index should be refreshed.
     * (If we should re-fetch the manifest)
     * @param {Number} _fromTime
     * @param {Number} toTime
     * @returns {Boolean}
     */
    shouldRefresh(_fromTime: number, toTime: number): boolean;
    /**
     * Returns first position in index.
     * @returns {Number}
     */
    getFirstPosition(): number;
    /**
     * Returns last position in index.
     * @returns {Number}
     */
    getLastPosition(): number;
    /**
     * We do not check for discontinuity in SegmentList-based indexes.
     * @returns {Number}
     */
    checkDiscontinuity(): -1;
    /**
     * @param {Object} newIndex
     */
    _update(newIndex: ListRepresentationIndex): void;
    /**
     * We do not have to add new segments to SegmentList-based indexes.
     * @returns {Array}
     */
    _addSegments(): void;
}

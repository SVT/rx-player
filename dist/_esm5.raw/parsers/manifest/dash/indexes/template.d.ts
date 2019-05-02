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
export interface ITemplateIndex {
    duration: number;
    timescale: number;
    indexRange?: [number, number];
    initialization?: {
        mediaURL: string;
        range?: [number, number];
    };
    mediaURL: string;
    presentationTimeOffset?: number;
    indexTimeOffset: number;
    startNumber?: number;
}
export interface ITemplateIndexIndexArgument {
    duration: number;
    timescale: number;
    indexRange?: [number, number];
    initialization?: {
        media?: string;
        range?: [number, number];
    };
    media?: string;
    presentationTimeOffset?: number;
    startNumber?: number;
}
export interface ITemplateIndexContextArgument {
    periodStart: number;
    representationBaseURL: string;
    representationId?: string;
    representationBitrate?: number;
}
export default class TemplateRepresentationIndex implements IRepresentationIndex {
    private _index;
    private _periodStart;
    /**
     * @param {Object} index
     * @param {Object} context
     */
    constructor(index: ITemplateIndexIndexArgument, context: ITemplateIndexContextArgument);
    /**
     * Construct init Segment.
     * @returns {Object}
     */
    getInitSegment(): ISegment;
    /**
     * @param {Number} fromTime
     * @param {Number} dur
     * @returns {Array.<Object>}
     */
    getSegments(fromTime: number, dur: number): ISegment[];
    /**
     * Returns first position in index.
     * @returns {undefined}
     */
    getFirstPosition(): undefined;
    /**
     * Returns last position in index.
     * @returns {undefined}
     */
    getLastPosition(): undefined;
    /**
     * Returns true if, based on the arguments, the index should be refreshed.
     * We never have to refresh a SegmentTemplate-based manifest.
     * @returns {Boolean}
     */
    shouldRefresh(): false;
    /**
     * We cannot check for discontinuity in SegmentTemplate-based indexes.
     * @returns {Number}
     */
    checkDiscontinuity(): -1;
    /**
     * We do not have to add new segments to SegmentList-based indexes.
     * @returns {Array}
     */
    _addSegments(): void;
    /**
     * @param {Object} newIndex
     */
    _update(newIndex: TemplateRepresentationIndex): void;
}

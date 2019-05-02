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
export interface ITimelineIndex {
    duration?: number;
    indexRange?: [number, number];
    indexTimeOffset: number;
    initialization?: {
        mediaURL: string;
        range?: [number, number];
    };
    isDynamic: boolean;
    mediaURL: string;
    startNumber?: number;
    timeline: IIndexSegment[];
    timelineEnd: number | undefined;
    timescale: number;
}
export interface ITimelineIndexIndexArgument {
    duration?: number;
    indexRange?: [number, number];
    initialization?: {
        media?: string;
        range?: [number, number];
    };
    media?: string;
    startNumber?: number;
    timeline: Array<{
        start?: number;
        repeatCount?: number;
        duration?: number;
    }>;
    timescale: number;
    presentationTimeOffset?: number;
}
export interface ITimelineIndexContextArgument {
    periodStart: number;
    periodEnd: number | undefined;
    isDynamic: boolean;
    representationBaseURL: string;
    representationId?: string;
    representationBitrate?: number;
}
export default class TimelineRepresentationIndex implements IRepresentationIndex {
    protected _index: ITimelineIndex;
    /**
     * @param {Object} index
     * @param {Object} context
     */
    constructor(index: ITimelineIndexIndexArgument, context: ITimelineIndexContextArgument);
    /**
     * Construct init Segment.
     * @returns {Object}
     */
    getInitSegment(): ISegment;
    /**
     * Asks for segments to download for a given time range.
     * @param {Number} from - Beginning of the time wanted, in seconds
     * @param {Number} duration - duration wanted, in seconds
     * @returns {Array.<Object>}
     */
    getSegments(from: number, duration: number): ISegment[];
    /**
     * Returns true if, based on the arguments, the index should be refreshed.
     * @param {Number} _start
     * @param {Number} end
     * @returns {Boolean}
     */
    shouldRefresh(_start: number, end: number): boolean;
    /**
     * Returns first position in index.
     * @returns {Number|undefined}
     */
    getFirstPosition(): number | undefined;
    /**
     * Returns lastItem position in index.
     * @returns {Number|undefined}
     */
    getLastPosition(): number | undefined;
    /**
     * Checks if the time given is in a discontinuity. That is:
     *   - We're on the upper bound of the current range (end of the range - time
     *     is inferior to the timescale)
     *   - The next range starts after the end of the current range.
     * @param {Number} _time
     * @returns {Number} - If a discontinuity is present, this is the Starting
     * time for the next (discontinuited) range. If not this is equal to -1.
     */
    checkDiscontinuity(_time: number): number;
    /**
     * @param {Object} newIndex
     */
    _update(newIndex: TimelineRepresentationIndex): void;
    /**
     * We do not have to add new segments to SegmentList-based indexes.
     * @param {Array.<Object>} nextSegments
     * @param {Object|undefined} currentSegmentInfos
     * @returns {Array}
     */
    _addSegments(nextSegments: Array<{
        duration: number;
        time: number;
        timescale: number;
    }>, currentSegmentInfos?: {
        duration?: number;
        time: number;
        timescale: number;
    }): void;
}

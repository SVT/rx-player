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
import { Adaptation, ISegment, Period, Representation } from "../../manifest";
interface IBufferedSegmentInfos {
    adaptation: Adaptation;
    period: Period;
    representation: Representation;
    segment: ISegment;
}
interface IBufferedSegment {
    bufferedEnd: number | undefined;
    bufferedStart: number | undefined;
    end: number;
    infos: IBufferedSegmentInfos;
    start: number;
}
/**
 * Keep track of every segment downloaded and currently in the browser's memory.
 *
 * The main point of this class is to know which CDN segments are already
 * pushed to the SourceBuffer, at which bitrate, and which have been
 * garbage-collected since by the browser (and thus should be re-downloaded).
 * @class SegmentBookkeeper
 */
export default class SegmentBookkeeper {
    inventory: IBufferedSegment[];
    constructor();
    /**
     * Infer each segment's bufferedStart and bufferedEnd from the TimeRanges
     * given (coming from the SourceBuffer).
     * @param {TimeRanges}
     *
     * TODO implement management of segments whose end is not known
     */
    synchronizeBuffered(buffered: TimeRanges): void;
    /**
     * Add a new segment in the inventory.
     *
     * Note: As new segments can "replace" partially or completely old ones, we
     * have to perform a complex logic and might update previously added segments.
     *
     * @param {Object} period
     * @param {Object} adaptation
     * @param {Object} representation
     * @param {Object} segment
     * @param {Number} start - start time of the segment, in seconds
     * @param {Number|undefined} end - end time of the segment, in seconds. Can
     * be undefined in some rare cases
     */
    insert(period: Period, adaptation: Adaptation, representation: Representation, segment: ISegment, start: number, end: number | undefined): void;
    /**
     * Returns segment infos for a segment corresponding to the given time,
     * duration and timescale.
     *
     * Returns null if either:
     *   - no segment can be linked exactly to the given time/duration
     *   - a segment is linked to this information, but is currently considered
     *     "incomplete" to be playable, in the sourceBuffer. We check if all
     *     needed data for playback (from wanted range) is loaded.
     *
     * The main purpose of this method is to know if the segment asked should be
     * downloaded (or re-downloaded).
     *
     * /!\ Make sure that this class is synchronized with the sourceBuffer
     * (see addBufferedInfos method of the same class) before calling this method,
     * as it depends on it to categorize "incomplete" from "complete" segments.
     *
     * @param {Object} wantedRange
     * @param {Object} segmentInfos
     * @returns {Object|null}
     */
    hasPlayableSegment(wantedRange: {
        start: number;
        end: number;
    }, segmentInfos: {
        time: number;
        duration: number;
        timescale: number;
    }): IBufferedSegment | null;
    /**
     * Empty the current inventory
     */
    reset(): void;
}
export {};

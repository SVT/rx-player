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
import { ISegment } from "../../../../manifest";
interface IIndexSegment {
    start: number;
    duration: number;
    repeatCount: number;
    range?: [number, number];
}
/**
 * Calculate the number of times a timeline element repeat.
 * @param {Object} element
 * @param {Object} nextElement
 * @param {number} timelineEnd
 * @returns {Number}
 */
declare function calculateRepeat(element: IIndexSegment, nextElement?: IIndexSegment | null, timelineEnd?: number): number;
/**
 * Convert from `presentationTime`, the time of the segment at the moment it
 * is decoded to `mediaTime`, the original time the segments point at.
 * @param {Object} index
 * @param {number} time
 * @returns {number}
 */
declare function toIndexTime(index: {
    timescale: number;
    indexTimeOffset: number;
}, time: number): number;
/**
 * Convert from `mediaTime`, the original time the segments point at to
 * `presentationTime`, the time of the segment at the moment it is decoded.
 * @param {Object} index
 * @param {number} time
 * @returns {number}
 */
declare function fromIndexTime(index: {
    timescale: number;
    indexTimeOffset: number;
}, time: number): number;
/**
 * @param {Object} index
 * @param {Number} start
 * @param {Number} duration
 * @returns {Object} - Object with two properties:
 *   - up {Number}: timescaled timestamp of the beginning time
 *   - to {Number}: timescaled timestamp of the end time (start time + duration)
 */
declare function getTimescaledRange(index: {
    timescale?: number;
}, start: number, duration: number): {
    up: number;
    to: number;
};
/**
 * @param {Object} segment
 * @param {Object|null} [nextSegment]
 * @param {number} timelineEnd
 * @returns {Number}
 */
declare function getIndexSegmentEnd(segment: IIndexSegment, nextSegment: IIndexSegment | null, timelineEnd: number | undefined): number;
/**
 * Construct init segment for the given index.
 * @param {Object} index
 * @returns {Object}
 */
declare function getInitSegment(index: {
    timescale: number;
    initialization?: {
        mediaURL: string;
        range?: [number, number];
    };
    indexRange?: [number, number];
    indexTimeOffset: number;
}): ISegment;
/**
 * Get a list of Segments for the time range wanted.
 * @param {Object} index - index object, constructed by parsing the manifest.
 * @param {number} from - starting timestamp wanted, in seconds
 * @param {number} durationWanted - duration wanted, in seconds
 * @returns {Array.<Object>}
 */
declare function getSegmentsFromTimeline(index: {
    mediaURL: string;
    startNumber?: number;
    timeline: IIndexSegment[];
    timescale: number;
    indexTimeOffset: number;
    timelineEnd?: number;
}, from: number, durationWanted: number): ISegment[];
/**
 * @param {string} representationURL
 * @param {string|undefined} media
 * @param {string|undefined} id
 * @param {number|undefined} bitrate
 * @returns {string}
 */
declare function createIndexURL(representationURL: string, media?: string, id?: string, bitrate?: number): string;
/**
 * Replace "tokens" written in a given path (e.g. $RepresentationID$) by the corresponding
 * infos, taken from the given segment.
 * @param {string} path
 * @param {string|undefined} id
 * @param {number|undefined} bitrate
 * @returns {string}
 */
declare function replaceRepresentationDASHTokens(path: string, id?: string, bitrate?: number): string;
/**
 * Replace "tokens" written in a given path (e.g. $Time$) by the corresponding
 * infos, taken from the given segment.
 * @param {string} path
 * @param {number} time
 * @param {number} number
 * @returns {string}
 *
 * @throws Error - Throws if we do not have enough data to construct the URL
 */
declare function replaceSegmentDASHTokens(path: string, time?: number, number?: number): string;
export { calculateRepeat, createIndexURL, fromIndexTime, getIndexSegmentEnd, getInitSegment, getSegmentsFromTimeline, getTimescaledRange, IIndexSegment, replaceRepresentationDASHTokens, replaceSegmentDASHTokens, toIndexTime, };

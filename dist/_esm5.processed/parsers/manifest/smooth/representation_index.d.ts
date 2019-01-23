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
import { IRepresentationIndex, ISegment } from "../../../manifest";
export interface IIndexSegment {
    start: number;
    duration: number;
    repeatCount: number;
}
interface ITimelineIndex {
    presentationTimeOffset?: number;
    timescale: number;
    media: string;
    timeline: IIndexSegment[];
    startNumber?: number;
    isLive: boolean;
    timeShiftBufferDepth?: number;
    manifestReceivedTime?: number;
}
interface ISmoothInitSegmentPrivateInfos {
    bitsPerSample?: number;
    channels?: number;
    codecPrivateData?: string;
    packetSize?: number;
    samplingRate?: number;
    protection?: {
        keyId: string;
        keySystems: Array<{
            systemId: string;
            privateData: Uint8Array;
        }>;
    };
}
/**
 * RepresentationIndex implementation for Smooth Manifests.
 *
 * Allows to interact with the index to create new Segments.
 *
 * @class SmoothRepresentationIndex
 */
export default class SmoothRepresentationIndex implements IRepresentationIndex {
    private _codecPrivateData?;
    private _bitsPerSample?;
    private _channels?;
    private _packetSize?;
    private _samplingRate?;
    private _initialLastPosition?;
    private _indexValidityTime;
    private _protection?;
    private _index;
    constructor(index: ITimelineIndex, infos: ISmoothInitSegmentPrivateInfos);
    /**
     * Construct init Segment compatible with a Smooth Manifest.
     * @returns {Object}
     */
    getInitSegment(): ISegment;
    /**
     * Generate a list of Segments for a particular period of time.
     *
     * @param {Number} _up
     * @param {Number} _to
     * @returns {Array.<Object>}
     */
    getSegments(_up: number, _to: number): ISegment[];
    /**
     * Returns true if, based on the arguments, the index should be refreshed.
     * (If we should re-fetch the manifest)
     * @param {Number} from
     * @param {Number} to
     * @returns {Boolean}
     */
    shouldRefresh(up: number, to: number): boolean;
    /**
     * Returns first position in the index.
     *
     * @param {Object} index
     * @returns {Number}
     */
    getFirstPosition(): number | undefined;
    /**
     * Returns last position in the index.
     * @param {Object} index
     * @returns {Number}
     */
    getLastPosition(): number | undefined;
    /**
     * Checks if the time given is in a discontinuity. That is:
     *   - We're on the upper bound of the current range (end of the range - time
     *     is inferior to the timescale)
     *   - The next range starts after the end of the current range.
     *
     * @param {Number} _time
     * @returns {Number} - If a discontinuity is present, this is the Starting
     * time for the next (discontinuited) range. If not this is equal to -1.
     */
    checkDiscontinuity(_time: number): number;
    /**
     * Update this RepresentationIndex by a newly downloaded one.
     * Check if the old index had more informations about new segments and
     * re-add them if that's the case.
     * @param {Object} newIndex
     */
    _update(newIndex: SmoothRepresentationIndex): void;
    _addSegments(nextSegments: Array<{
        duration: number;
        time: number;
        timescale: number;
    }>, currentSegment: {
        duration: number;
        time: number;
        timescale: number;
    }): void;
}
export {};

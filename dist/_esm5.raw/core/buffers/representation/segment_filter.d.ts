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
import { Adaptation, ISegment, Period, Representation } from "../../../manifest";
import SimpleSet from "../../../utils/simple_set";
import SegmentBookkeeper from "../segment_bookkeeper";
/**
 * Returns true if the given Segment should be downloaded.
 * false otherwise.
 *
 * @param {Object} segment
 * @param {Object} content - The content the Segment depends on.
 * @param {Object} segmentBookkeeper
 * @param {Object} wantedRange
 * @param {Object} segmentIDsToIgnore
 * @returns {boolean}
 */
export default function shouldDownloadSegment(segment: ISegment, content: {
    period: Period;
    adaptation: Adaptation;
    representation: Representation;
}, segmentBookkeeper: SegmentBookkeeper, wantedRange: {
    start: number;
    end: number;
}, segmentIDsToIgnore: SimpleSet): boolean;

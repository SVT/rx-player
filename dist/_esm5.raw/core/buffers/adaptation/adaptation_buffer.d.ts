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
import { Observable } from "rxjs";
import Manifest, { Adaptation, Period } from "../../../manifest";
import ABRManager from "../../abr";
import { IPrioritizedSegmentFetcher } from "../../pipelines";
import { QueuedSourceBuffer } from "../../source_buffers";
import { IRepresentationBufferClockTick } from "../representation";
import SegmentBookkeeper from "../segment_bookkeeper";
import { IAdaptationBufferEvent, IBufferEventAddedSegment, IBufferNeedsDiscontinuitySeek, IBufferNeedsManifestRefresh, IBufferStateActive, IBufferStateFull } from "../types";
export interface IAdaptationBufferClockTick extends IRepresentationBufferClockTick {
    bufferGap: number;
    duration: number;
    isLive: boolean;
    readyState: number;
    speed: number;
}
/**
 * Create new Buffer Observable linked to the given Adaptation.
 *
 * It will rely on the ABRManager to choose at any time the best Representation
 * for this Adaptation and then run the logic to download and push the
 * corresponding segments in the SourceBuffer.
 *
 * It will emit various events to report its status to the caller.
 *
 * @param {Observable} clock$ - Clock at which the Buffer will check for
 * segments download
 * @param {QueuedSourceBuffer} queuedSourceBuffer - QueuedSourceBuffer used
 * to push segments and know about the current real buffer's health.
 * @param {SegmentBookkeeper} segmentBookkeeper - Used to synchronize and
 * retrieve the Segments currently present in the QueuedSourceBuffer
 * @param {Function} segmentFetcher - Function used to download segments
 * @param {Observable} wantedBufferAhead$ - Emits the buffer goal
 * @param {Object} content - Content to download
 * @param {Object} abrManager
 * @returns {Observable}
 */
export default function AdaptationBuffer<T>(clock$: Observable<IAdaptationBufferClockTick>, queuedSourceBuffer: QueuedSourceBuffer<T>, segmentBookkeeper: SegmentBookkeeper, segmentFetcher: IPrioritizedSegmentFetcher<T>, wantedBufferAhead$: Observable<number>, content: {
    manifest: Manifest;
    period: Period;
    adaptation: Adaptation;
}, abrManager: ABRManager, options: {
    manualBitrateSwitchingMode: "seamless" | "direct";
}): Observable<IAdaptationBufferEvent<T>>;
export { IBufferEventAddedSegment, IBufferNeedsDiscontinuitySeek, IBufferNeedsManifestRefresh, IBufferStateActive, IBufferStateFull, };

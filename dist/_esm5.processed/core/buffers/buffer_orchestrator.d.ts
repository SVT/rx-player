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
import Manifest, { Period } from "../../manifest";
import ABRManager from "../abr";
import { SegmentPipelinesManager } from "../pipelines";
import SourceBuffersManager, { ITextTrackSourceBufferOptions } from "../source_buffers";
import { IPeriodBufferClockTick } from "./period";
import { IBufferOrchestratorEvent } from "./types";
export declare type IBufferOrchestratorClockTick = IPeriodBufferClockTick;
/**
 * Create and manage the various Buffer Observables needed for the content to
 * play:
 *
 *   - Create or dispose SourceBuffers depending on the chosen adaptations.
 *
 *   - Push the right segments to those SourceBuffers depending on the user's
 *     preferences, the current position, the bandwidth, the decryption
 *     conditions...
 *
 *   - Concatenate Buffers for adaptation from separate Periods at the right
 *     time, to allow smooth transitions between periods.
 *
 *   - Emit various events to notify of its health and issues
 *
 * Here multiple buffers can be created at the same time to allow smooth
 * transitions between periods.
 * To do this, we dynamically create or destroy buffers as they are needed.
 * @param {Object} content
 * @param {Observable} clock$ - Emit position informations
 * @param {Object} abrManager - Emit bitrate estimation and best Representation
 * to play.
 * @param {Object} sourceBuffersManager - Will be used to lazily create
 * SourceBuffer instances associated with the current content.
 * @param {Object} segmentPipelinesManager - Download segments
 * @param {Object} options
 * @returns {Observable}
 *
 * TODO Special case for image Buffer, where we want data for EVERY active
 * periods.
 */
export default function BufferOrchestrator(content: {
    manifest: Manifest;
    initialPeriod: Period;
}, clock$: Observable<IBufferOrchestratorClockTick>, abrManager: ABRManager, sourceBuffersManager: SourceBuffersManager, segmentPipelinesManager: SegmentPipelinesManager<any>, options: {
    wantedBufferAhead$: Observable<number>;
    maxBufferAhead$: Observable<number>;
    maxBufferBehind$: Observable<number>;
    segmentRetry?: number;
    offlineRetry?: number;
    textTrackOptions?: ITextTrackSourceBufferOptions;
    manualBitrateSwitchingMode: "seamless" | "direct";
}): Observable<IBufferOrchestratorEvent>;

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
import { ITransportPipelines } from "../../transports";
import { IEMEManagerEvent, IKeySystemOption } from "../eme";
import { IBufferType, ITextTrackSourceBufferOptions } from "../source_buffers";
import { IEMEDisabledEvent } from "./create_eme_manager";
import { IInitialTimeOptions } from "./get_initial_time";
import { IMediaSourceLoaderEvent } from "./load_on_media_source";
import { IInitClockTick, IManifestReadyEvent, IReloadingMediaSourceEvent, IWarningEvent } from "./types";
export interface IInitializeOptions {
    adaptiveOptions: {
        initialBitrates: Partial<Record<IBufferType, number>>;
        manualBitrates: Partial<Record<IBufferType, number>>;
        maxAutoBitrates: Partial<Record<IBufferType, number>>;
        throttle: Partial<Record<IBufferType, Observable<number>>>;
        limitWidth: Partial<Record<IBufferType, Observable<number>>>;
    };
    autoPlay: boolean;
    bufferOptions: {
        wantedBufferAhead$: Observable<number>;
        maxBufferAhead$: Observable<number>;
        maxBufferBehind$: Observable<number>;
        manualBitrateSwitchingMode: "seamless" | "direct";
    };
    clock$: Observable<IInitClockTick>;
    keySystems: IKeySystemOption[];
    mediaElement: HTMLMediaElement;
    networkConfig: {
        manifestRetry?: number;
        offlineRetry?: number;
        segmentRetry?: number;
    };
    speed$: Observable<number>;
    startAt?: IInitialTimeOptions;
    textTrackOptions: ITextTrackSourceBufferOptions;
    pipelines: ITransportPipelines;
    url: string;
}
export declare type IInitEvent = IManifestReadyEvent | IMediaSourceLoaderEvent | IEMEManagerEvent | IEMEDisabledEvent | IReloadingMediaSourceEvent | IWarningEvent;
/**
 * Central part of the player.
 *
 * Play a content described by the given Manifest.
 *
 * On subscription:
 *  - Creates the MediaSource and attached sourceBuffers instances.
 *  - download the content's manifest
 *  - Perform EME management if needed
 *  - get Buffers for each active adaptations.
 *  - give choice of the adaptation to the caller (e.g. to choose a language)
 *  - returns Observable emitting notifications about the content lifecycle.
 * @param {Object} args
 * @returns {Observable}
 */
export default function InitializeOnMediaSource({ adaptiveOptions, autoPlay, bufferOptions, clock$, keySystems, mediaElement, networkConfig, speed$, startAt, textTrackOptions, pipelines, url, }: IInitializeOptions): Observable<IInitEvent>;

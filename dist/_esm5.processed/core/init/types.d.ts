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
import { ICustomError } from "../../errors";
import Manifest from "../../manifest";
import ABRManager from "../abr";
import { IRepresentationChangeEvent } from "../buffers";
import { IStallingItem } from "./get_stalled_events";
export interface IInitClockTick {
    currentTime: number;
    buffered: TimeRanges;
    duration: number;
    bufferGap: number;
    state: string;
    playbackRate: number;
    currentRange: {
        start: number;
        end: number;
    } | null;
    readyState: number;
    paused: boolean;
    stalled: {
        reason: "seeking" | "not-ready" | "buffering";
        timestamp: number;
    } | null;
    seeking: boolean;
}
export interface IManifestReadyEvent {
    type: "manifestReady";
    value: {
        abrManager: ABRManager;
        manifest: Manifest;
    };
}
export interface IWarningEvent {
    type: "warning";
    value: Error | ICustomError;
}
export interface IReloadingMediaSourceEvent {
    type: "reloading-media-source";
    value: undefined;
}
export interface ISpeedChangedEvent {
    type: "speedChanged";
    value: number;
}
export interface IStalledEvent {
    type: "stalled";
    value: IStallingItem | null;
}
export interface ILoadedEvent {
    type: "loaded";
    value: true;
}
export { IRepresentationChangeEvent };

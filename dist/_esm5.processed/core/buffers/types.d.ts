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
import { Subject } from "rxjs";
import { ICustomError } from "../../errors";
import { Adaptation, ISegment, Period, Representation } from "../../manifest";
import { IBufferType } from "../source_buffers";
export interface IBufferEventAddedSegment<T> {
    type: "added-segment";
    value: {
        bufferType: IBufferType;
        segment: ISegment;
        segmentData: T;
    };
}
export interface IBufferNeedsManifestRefresh {
    type: "needs-manifest-refresh";
    value: {
        bufferType: IBufferType;
    };
}
export interface IBufferNeedsDiscontinuitySeek {
    type: "discontinuity-encountered";
    value: {
        bufferType: IBufferType;
        nextTime: number;
    };
}
export declare type IBufferNeededActions = IBufferNeedsManifestRefresh | IBufferNeedsDiscontinuitySeek;
export interface IBufferStateActive {
    type: "active-buffer";
    value: {
        bufferType: IBufferType;
    };
}
export interface IBufferStateFull {
    type: "full-buffer";
    value: {
        bufferType: IBufferType;
    };
}
export declare type IRepresentationBufferStateEvent = IBufferNeededActions | IBufferStateFull | IBufferStateActive;
export declare type IRepresentationBufferEvent<T> = IBufferEventAddedSegment<T> | IRepresentationBufferStateEvent;
export interface IBitrateEstimationChangeEvent {
    type: "bitrateEstimationChange";
    value: {
        type: IBufferType;
        bitrate: number | undefined;
    };
}
export interface IRepresentationChangeEvent {
    type: "representationChange";
    value: {
        type: IBufferType;
        period: Period;
        representation: Representation | null;
    };
}
export declare type IAdaptationBufferEvent<T> = IRepresentationBufferEvent<T> | IBitrateEstimationChangeEvent | INeedsMediaSourceReload | IRepresentationChangeEvent;
export interface IAdaptationChangeEvent {
    type: "adaptationChange";
    value: {
        type: IBufferType;
        period: Period;
        adaptation: Adaptation | null;
    };
}
export interface IActivePeriodChangedEvent {
    type: "activePeriodChanged";
    value: {
        period: Period;
    };
}
export interface IPeriodBufferReadyEvent {
    type: "periodBufferReady";
    value: {
        type: IBufferType;
        period: Period;
        adaptation$: Subject<Adaptation | null>;
    };
}
export interface IPeriodBufferClearedEvent {
    type: "periodBufferCleared";
    value: {
        type: IBufferType;
        period: Period;
    };
}
export interface IEndOfStreamEvent {
    type: "end-of-stream";
    value: undefined;
}
export interface IResumeStreamEvent {
    type: "resume-stream";
    value: undefined;
}
export interface ICompletedBufferEvent {
    type: "complete-buffer";
    value: {
        type: IBufferType;
    };
}
export interface INeedsMediaSourceReload {
    type: "needs-media-source-reload";
    value: undefined;
}
export declare type IPeriodBufferEvent = IPeriodBufferReadyEvent | IAdaptationBufferEvent<unknown> | IBufferWarningEvent | INeedsMediaSourceReload | IAdaptationChangeEvent;
export declare type IMultiplePeriodBuffersEvent = IPeriodBufferEvent | IPeriodBufferClearedEvent | ICompletedBufferEvent;
export declare type IBufferOrchestratorEvent = IActivePeriodChangedEvent | IMultiplePeriodBuffersEvent | IEndOfStreamEvent | IResumeStreamEvent;
export interface IBufferWarningEvent {
    type: "warning";
    value: Error | ICustomError;
}

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
import { Observable, Observer } from "rxjs";
import Manifest, { Adaptation, IRepresentationFilter, ISegment, ISupplementaryImageTrack, ISupplementaryTextTrack, Period, Representation } from "../manifest";
import { IBifThumbnail } from "../parsers/images/bif";
export interface ISegmentTimingInfos {
    duration?: number;
    time: number;
    timescale: number;
}
export interface INextSegmentsInfos {
    duration: number;
    time: number;
    timescale: number;
}
export interface IManifestLoaderArguments {
    url: string;
}
export interface ISegmentLoaderArguments {
    manifest: Manifest;
    period: Period;
    adaptation: Adaptation;
    representation: Representation;
    segment: ISegment;
}
export interface ILoaderResponseValue<T> {
    responseData: T;
    duration?: number;
    size?: number;
    url?: string;
    sendingTime?: number;
    receivedTime?: number;
}
export interface ILoaderResponse<T> {
    type: "response";
    value: ILoaderResponseValue<T>;
}
interface ILoaderData<T> {
    type: "data";
    value: {
        responseData: T;
    };
}
export interface ILoaderProgress {
    type: "progress";
    value: {
        duration: number;
        size: number;
        totalSize?: number;
        url: string;
    };
}
interface ILoaderData<T> {
    type: "data";
    value: {
        responseData: T;
    };
}
export declare type ILoaderEvent<T> = ILoaderProgress | ILoaderResponse<T> | ILoaderData<T>;
export declare type ILoaderObserver<T> = Observer<ILoaderEvent<T>>;
export declare type ILoaderObservable<T> = Observable<ILoaderEvent<T>>;
export interface IManifestParserArguments<T, U> {
    response: ILoaderResponseValue<T>;
    url: string;
    scheduleRequest: (request: () => Observable<U>) => Observable<U>;
}
export interface ISegmentParserArguments<T> {
    response: ILoaderResponseValue<T>;
    init?: ISegmentTimingInfos;
    manifest: Manifest;
    period: Period;
    adaptation: Adaptation;
    representation: Representation;
    segment: ISegment;
}
export interface IManifestParserResult {
    manifest: Manifest;
    url?: string;
}
export declare type IManifestParserObservable = Observable<IManifestParserResult>;
export declare type SegmentParserObservable = Observable<{
    segmentData: Uint8Array | ArrayBuffer | null;
    segmentInfos: ISegmentTimingInfos | null;
    segmentOffset: number;
}>;
export interface ITextTrackSegmentData {
    data: string;
    end?: number;
    language?: string;
    start: number;
    timescale: number;
    type: string;
}
export declare type TextTrackParserObservable = Observable<{
    segmentData: ITextTrackSegmentData | null;
    segmentInfos: ISegmentTimingInfos | null;
    segmentOffset: number;
}>;
export interface IImageTrackSegmentData {
    data: IBifThumbnail[];
    end: number;
    start: number;
    timescale: number;
    type: string;
}
export declare type ImageParserObservable = Observable<{
    segmentData: IImageTrackSegmentData | null;
    segmentInfos: ISegmentTimingInfos | null;
    segmentOffset: number;
}>;
export interface ITransportManifestPipeline {
    resolver?: (x: IManifestLoaderArguments) => Observable<IManifestLoaderArguments>;
    loader: (x: IManifestLoaderArguments) => ILoaderObservable<Document | string>;
    parser: (x: IManifestParserArguments<Document | string, string>) => IManifestParserObservable;
}
interface ITransportSegmentPipelineBase<T> {
    loader: (x: ISegmentLoaderArguments) => ILoaderObservable<T>;
    parser: (x: ISegmentParserArguments<T>) => SegmentParserObservable;
}
export declare type ITransportVideoSegmentPipeline = ITransportSegmentPipelineBase<Uint8Array | ArrayBuffer | null>;
export declare type ITransportAudioSegmentPipeline = ITransportSegmentPipelineBase<Uint8Array | ArrayBuffer | null>;
export interface ITransportTextSegmentPipeline {
    loader: (x: ISegmentLoaderArguments) => ILoaderObservable<Uint8Array | ArrayBuffer | string | null>;
    parser: (x: ISegmentParserArguments<Uint8Array | ArrayBuffer | string | null>) => TextTrackParserObservable;
}
export interface ITransportImageSegmentPipeline {
    loader: (x: ISegmentLoaderArguments) => ILoaderObservable<Uint8Array | ArrayBuffer | null>;
    parser: (x: ISegmentParserArguments<Uint8Array | ArrayBuffer | null>) => ImageParserObservable;
}
export declare type ITransportSegmentPipeline = ITransportAudioSegmentPipeline | ITransportVideoSegmentPipeline | ITransportTextSegmentPipeline | ITransportImageSegmentPipeline;
export declare type ITransportPipeline = ITransportManifestPipeline | ITransportSegmentPipeline;
export interface ITransportPipelines {
    manifest: ITransportManifestPipeline;
    audio: ITransportAudioSegmentPipeline;
    video: ITransportVideoSegmentPipeline;
    text: ITransportTextSegmentPipeline;
    image: ITransportImageSegmentPipeline;
}
interface IParsedKeySystem {
    systemId: string;
    privateData: Uint8Array;
}
export interface ITransportOptions {
    segmentLoader?: CustomSegmentLoader;
    manifestLoader?: CustomManifestLoader;
    suggestedPresentationDelay?: number;
    referenceDateTime?: number;
    minRepresentationBitrate?: number;
    keySystems?: (hex?: Uint8Array) => IParsedKeySystem[];
    representationFilter?: IRepresentationFilter;
    supplementaryImageTracks?: ISupplementaryImageTrack[];
    supplementaryTextTracks?: ISupplementaryTextTrack[];
}
export declare type ITransportFunction = (options?: ITransportOptions) => ITransportPipelines;
export declare type CustomSegmentLoader = (args: {
    adaptation: Adaptation;
    representation: Representation;
    segment: ISegment;
    transport: string;
    url: string;
    manifest: Manifest;
}, callbacks: {
    resolve: (args: {
        data: ArrayBuffer | Uint8Array;
        size: number;
        duration: number;
    }) => void;
    reject: (err?: Error) => void;
    fallback?: () => void;
}) => (() => void) | void;
export declare type CustomManifestLoader = (url: string, callbacks: {
    resolve: (args: {
        data: Document | string;
        size: number;
        duration: number;
    }) => void;
    reject: (err?: Error) => void;
    fallback?: () => void;
}) => (() => void) | void;
export {};

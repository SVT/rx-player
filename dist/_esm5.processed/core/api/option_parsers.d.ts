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
import { IRepresentationFilter } from "../../manifest";
import { CustomManifestLoader, CustomSegmentLoader } from "../../transports";
import { IKeySystemOption } from "../eme";
import { IAudioTrackPreference, ITextTrackPreference } from "./track_manager";
export { IKeySystemOption };
export interface ITransportOptions {
    aggressiveMode?: boolean;
    manifestLoader?: CustomManifestLoader;
    segmentLoader?: CustomSegmentLoader;
    representationFilter?: IRepresentationFilter;
    referenceDateTime?: number;
}
export interface ISupplementaryTextTrackOption {
    url: string;
    language: string;
    closedCaption: boolean;
    mimeType: string;
    codecs?: string;
}
export interface ISupplementaryImageTrackOption {
    url: string;
    mimeType: string;
}
export interface IDefaultAudioTrackOption {
    language: string;
    normalized: string;
    audioDescription: boolean;
}
export interface IDefaultTextTrackOption {
    language: string;
    normalized: string;
    closedCaption: boolean;
}
export declare type ITextTrackPreference = null | {
    language: string;
    closedCaption: boolean;
};
export interface INetworkConfigOption {
    manifestRetry?: number;
    offlineRetry?: number;
    segmentRetry?: number;
}
export declare type IStartAtOption = {
    position: number;
} | {
    wallClockTime: Date | number;
} | {
    percentage: number;
} | {
    fromLastPosition: number;
} | {
    fromFirstPosition: number;
};
declare type IParsedStartAtOption = {
    position: number;
} | {
    wallClockTime: number;
} | {
    percentage: number;
} | {
    fromLastPosition: number;
} | {
    fromFirstPosition: number;
};
export interface IConstructorOptions {
    maxBufferAhead?: number;
    maxBufferBehind?: number;
    wantedBufferAhead?: number;
    limitVideoWidth?: boolean;
    throttleWhenHidden?: boolean;
    preferredAudioTracks?: IAudioTrackPreference[];
    preferredTextTracks?: ITextTrackPreference[];
    videoElement?: HTMLMediaElement;
    initialVideoBitrate?: number;
    initialAudioBitrate?: number;
    maxAudioBitrate?: number;
    maxVideoBitrate?: number;
    stopAtEnd?: boolean;
}
export interface IParsedConstructorOptions {
    maxBufferAhead: number;
    maxBufferBehind: number;
    wantedBufferAhead: number;
    limitVideoWidth: boolean;
    throttleWhenHidden: boolean;
    preferredAudioTracks: IAudioTrackPreference[];
    preferredTextTracks: ITextTrackPreference[];
    videoElement: HTMLMediaElement;
    initialVideoBitrate: number;
    initialAudioBitrate: number;
    maxAudioBitrate: number;
    maxVideoBitrate: number;
    stopAtEnd: boolean;
}
export interface ILoadVideoOptions {
    url: string;
    transport: string;
    autoPlay?: boolean;
    keySystems?: IKeySystemOption[];
    transportOptions?: ITransportOptions | undefined;
    supplementaryTextTracks?: ISupplementaryTextTrackOption[];
    supplementaryImageTracks?: ISupplementaryImageTrackOption[];
    defaultAudioTrack?: IDefaultAudioTrackOption | null | undefined;
    defaultTextTrack?: IDefaultTextTrackOption | null | undefined;
    networkConfig?: INetworkConfigOption;
    startAt?: IStartAtOption;
    textTrackMode?: "native" | "html";
    hideNativeSubtitle?: boolean;
    textTrackElement?: HTMLElement;
    manualBitrateSwitchingMode?: "seamless" | "direct";
}
interface IParsedLoadVideoOptionsBase {
    url: string;
    transport: string;
    autoPlay: boolean;
    keySystems: IKeySystemOption[];
    networkConfig: INetworkConfigOption;
    transportOptions: ITransportOptions;
    supplementaryTextTracks: ISupplementaryTextTrackOption[];
    supplementaryImageTracks: ISupplementaryImageTrackOption[];
    defaultAudioTrack: IAudioTrackPreference | null | undefined;
    defaultTextTrack: ITextTrackPreference | null | undefined;
    startAt: IParsedStartAtOption | undefined;
    manualBitrateSwitchingMode: "seamless" | "direct";
}
interface IParsedLoadVideoOptionsNative extends IParsedLoadVideoOptionsBase {
    textTrackMode: "native";
    hideNativeSubtitle: boolean;
}
interface IParsedLoadVideoOptionsHTML extends IParsedLoadVideoOptionsBase {
    textTrackMode: "html";
    textTrackElement: HTMLElement;
}
export declare type IParsedLoadVideoOptions = IParsedLoadVideoOptionsNative | IParsedLoadVideoOptionsHTML;
/**
 * Parse options given to the API constructor and set default options as found
 * in the config.
 *
 * Do not mutate anything, only cross the given options and sane default options
 * (most coming from the config).
 * @param {Object|undefined} options
 * @returns {Object}
 */
declare function parseConstructorOptions(options: IConstructorOptions): IParsedConstructorOptions;
/**
 * Parse options given to loadVideo and set default options as found
 * in the config.
 *
 * Do not mutate anything, only cross the given options and sane default options
 * (most coming from the config).
 *
 * Throws if any mandatory option is not set.
 * @param {Object|undefined} options
 * @param {Object} ctx - The player context, needed for some default values.
 * @returns {Object}
 */
declare function parseLoadVideoOptions(options: ILoadVideoOptions): IParsedLoadVideoOptions;
export { parseConstructorOptions, parseLoadVideoOptions, };

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
import { IParsedContentComponent } from "./ContentComponent";
import { IParsedContentProtection } from "./ContentProtection";
import { IRepresentationIntermediateRepresentation } from "./Representation";
import { IParsedSegmentBase } from "./SegmentBase";
import { IParsedSegmentList } from "./SegmentList";
import { IParsedSegmentTemplate, IParsedSegmentTimeline } from "./SegmentTemplate";
import { IScheme } from "./utils";
export interface IAdaptationSetIntermediateRepresentation {
    children: IAdaptationSetChildren;
    attributes: IAdaptationSetAttributes;
}
export interface IAdaptationSetChildren {
    baseURL: string;
    representations: IRepresentationIntermediateRepresentation[];
    accessibility?: IScheme;
    contentComponent?: IParsedContentComponent;
    contentProtections?: IParsedContentProtection[];
    roles?: IScheme[];
    supplementalProperties?: IScheme[];
    segmentBase?: IParsedSegmentBase;
    segmentList?: IParsedSegmentList;
    segmentTemplate?: IParsedSegmentTemplate | IParsedSegmentTimeline;
}
export interface IAdaptationSetAttributes {
    audioSamplingRate?: string;
    bitstreamSwitching?: boolean;
    codecs?: string;
    codingDependency?: boolean;
    contentType?: string;
    frameRate?: string;
    group?: number;
    height?: number;
    id?: string;
    language?: string;
    maxBitrate?: number;
    maxFrameRate?: string;
    maxHeight?: number;
    maxPlayoutRate?: number;
    maxWidth?: number;
    maximumSAPPeriod?: number;
    mimeType?: string;
    minBitrate?: number;
    minFrameRate?: string;
    minHeight?: number;
    minWidth?: number;
    par?: string;
    profiles?: string;
    segmentAlignment?: number | boolean;
    segmentProfiles?: string;
    subsegmentAlignment?: number | boolean;
    width?: number;
}
export declare function createAdaptationSetIntermediateRepresentation(adaptationSetElement: Element): IAdaptationSetIntermediateRepresentation;

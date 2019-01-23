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
import { IPeriodIntermediateRepresentation } from "./Period";
import { IScheme } from "./utils";
export interface IMPDIntermediateRepresentation {
    children: IMPDChildren;
    attributes: IMPDAttributes;
}
export interface IMPDChildren {
    baseURL: string;
    locations: string[];
    periods: IPeriodIntermediateRepresentation[];
    utcTimings: IScheme[];
}
export interface IMPDAttributes {
    id?: string;
    profiles?: string;
    type?: string;
    availabilityStartTime?: number;
    availabilityEndTime?: number;
    publishTime?: number;
    duration?: number;
    minimumUpdatePeriod?: number;
    minBufferTime?: number;
    timeShiftBufferDepth?: number;
    suggestedPresentationDelay?: number;
    maxSegmentDuration?: number;
    maxSubsegmentDuration?: number;
}
export interface IParsedMPD {
    availabilityStartTime: number;
    duration: number;
    id: string;
    periods: IPeriodIntermediateRepresentation[];
    utcTimings: IScheme[];
    transportType: string;
    type: string;
    uris: string[];
    profiles?: string;
    availabilityEndTime?: number;
    publishTime?: number;
    minimumUpdatePeriod?: number;
    minBufferTime?: number;
    timeShiftBufferDepth?: number;
    suggestedPresentationDelay?: number;
    maxSegmentDuration?: number;
    maxSubsegmentDuration?: number;
    presentationLiveGap?: number;
}
export declare function createMPDIntermediateRepresentation(root: Element): IMPDIntermediateRepresentation;

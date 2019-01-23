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
import { Observable, Subject } from "rxjs";
import { ICustomError } from "../../../errors";
import { ISegmentLoaderArguments, ISegmentTimingInfos, ITransportPipelines } from "../../../transports";
import { IABRMetric, IABRRequest } from "../../abr";
import { IBufferType } from "../../source_buffers";
import { IPipelineLoaderOptions } from "../utils/create_loader";
interface IParsedSegment<T> {
    segmentData: T;
    segmentInfos: {
        duration?: number;
        time: number;
        timescale: number;
    };
    segmentOffset: number;
}
export interface IFetchedSegment<T> {
    parse: (init?: ISegmentTimingInfos) => Observable<IParsedSegment<T>>;
}
export declare type ISegmentFetcher<T> = (content: ISegmentLoaderArguments) => Observable<IFetchedSegment<T>>;
/**
 * Create a function which will fetch segments.
 *
 * This function will:
 *   - only emit the resulting data
 *   - dispatch the other infos through the right subjects.
 *
 * @param {string} bufferType
 * @param {Object} transport
 * @param {Subject} network$ - Subject through which network metrics will be
 * sent, for the ABR.
 * @param {Subject} requests$ - Subject through which requests infos will be
 * sent, for the ABR.
 * @param {Subject} warning$ - Subject through which minor requests error will
 * be sent.
 * @param {Object} options
 * @returns {Function}
 */
export default function createSegmentFetcher<T>(bufferType: IBufferType, transport: ITransportPipelines, network$: Subject<IABRMetric>, requests$: Subject<Subject<IABRRequest>>, warning$: Subject<Error | ICustomError>, options: IPipelineLoaderOptions<ISegmentLoaderArguments, T>): ISegmentFetcher<T>;
export {};

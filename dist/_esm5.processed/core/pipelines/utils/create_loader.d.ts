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
import { ICustomError } from "../../../errors";
import { ILoaderProgress, ILoaderResponseValue, ITransportPipeline } from "../../../transports";
export interface IPipelineLoaderError {
    type: "error";
    value: Error | ICustomError;
}
export interface IPipelineLoaderMetrics {
    type: "metrics";
    value: {
        size?: number;
        duration?: number;
    };
}
export interface IPipelineLoaderRequest<T> {
    type: "request";
    value: T;
}
export interface IPipelineLoaderResponse<T> {
    type: "response";
    value: {
        responseData: T;
        url?: string;
        sendingTime?: number;
    };
}
/**
 * Type parameters:
 *   T: Argument given to the loader
 *   U: ResponseType of the request
 */
export declare type IPipelineLoaderEvent<T, U> = IPipelineLoaderRequest<T> | IPipelineLoaderResponse<U> | ILoaderProgress | IPipelineLoaderError | IPipelineLoaderMetrics;
export interface IPipelineLoaderOptions<T, U> {
    cache?: {
        add: (obj: T, arg: ILoaderResponseValue<U>) => void;
        get: (obj: T) => ILoaderResponseValue<U>;
    };
    maxRetry: number;
    maxRetryOffline: number;
}
/**
 * Returns function allowing to download the wanted data through a
 * resolver -> loader pipeline.
 *
 * (The data can be for example: the manifest, audio and video segments, text,
 * images...)
 *
 * The function returned takes the initial data in arguments and returns an
 * Observable which will emit:
 *
 *   - each time a request begins (type "request").
 *     This is not emitted if the value is retrieved from a local js cache.
 *     This one emit the payload as a value.
 *
 *   - as the request progresses (type "progress").
 *
 *   - each time a request ends (type "metrics").
 *     This one contains informations about the metrics of the request.
 *
 *   - each time a minor request error is encountered (type "error").
 *     With the error as a value.
 *
 *   - Lastly, with the fetched data (type "response").
 *
 *
 * Each of these but "error" can be emitted at most one time.
 *
 * This observable will throw if, following the options given, the request and
 * possible retry all failed.
 *
 * This observable will complete after emitting the data.
 *
 * Type parameters:
 *   T: Argument given to the loader
 *   U: ResponseType of the request
 *
 * @param {Object} transportPipeline
 * @param {Object} options
 * @returns {Function}
 */
export default function createLoader<T, U>(transportPipeline: ITransportPipeline, options: IPipelineLoaderOptions<T, U>): (x: T) => Observable<IPipelineLoaderEvent<T, U>>;

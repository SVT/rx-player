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
import { ISegmentLoaderArguments } from "../../../transports";
import ObservablePrioritizer from "./prioritizer";
import { IFetchedSegment, ISegmentFetcher } from "./segment_fetcher";
export interface IPrioritizedSegmentFetcher<T> {
    createRequest: (content: ISegmentLoaderArguments, priority?: number) => Observable<IFetchedSegment<T>>;
    updatePriority: (observable: Observable<IFetchedSegment<T>>, priority: number) => void;
}
/**
 * This function basically put in relation:
 *   - a SegmentFetcher, which will be used to perform the segment request
 *   - a prioritizer, which will handle the priority of a segment request
 *
 * and returns functions to fetch segments with a given priority.
 * @param {Object} prioritizer
 * @param {Object} fetcher
 * @returns {Object}
 */
export default function applyPrioritizerToSegmentFetcher<T>(prioritizer: ObservablePrioritizer<IFetchedSegment<T>>, fetcher: ISegmentFetcher<T>): IPrioritizedSegmentFetcher<T>;

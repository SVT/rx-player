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
import { ILoaderObservable, ISegmentLoaderArguments, ISegmentParserArguments, TextTrackParserObservable } from "../types";
/**
 * Perform requests for "text" segments
 * @param {Object} infos
 * @returns {Observable.<Object>}
 */
declare function TextTrackLoader({ segment, representation }: ISegmentLoaderArguments): ILoaderObservable<ArrayBuffer | string | null>;
/**
 * Parse TextTrack data.
 * @param {Object} infos
 * @returns {Observable.<Object>}
 */
declare function TextTrackParser({ response, segment, adaptation, representation, init, }: ISegmentParserArguments<Uint8Array | ArrayBuffer | string | null>): TextTrackParserObservable;
export { TextTrackLoader as loader, TextTrackParser as parser, };

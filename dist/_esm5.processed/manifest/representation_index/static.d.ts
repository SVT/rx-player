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
import IRepresentationIndex, { ISegment } from "./types";
export interface IStaticRepresentationIndexInfos {
    media: string;
}
/**
 * Simple RepresentationIndex implementation for static files.
 * @class StaticRepresentationIndex
 */
export default class StaticRepresentationIndex implements IRepresentationIndex {
    private readonly _media;
    /**
     * @param {Object} infos
     */
    constructor(infos: IStaticRepresentationIndexInfos);
    /**
     * Static contents do not have any initialization segments.
     * Just return null.
     * @returns {null}
     */
    getInitSegment(): null;
    /**
     * Returns the only Segment available here.
     * @returns {Array.<Object>}
     */
    getSegments(): ISegment[];
    /**
     * Returns first position in index.
     * @returns {undefined}
     */
    getFirstPosition(): undefined;
    /**
     * Returns last position in index.
     * @returns {undefined}
     */
    getLastPosition(): undefined;
    /**
     * Returns false as a static file never need to be refreshed.
     * @returns {Boolean}
     */
    shouldRefresh(): false;
    /**
     * @returns {Number}
     */
    checkDiscontinuity(): -1;
    _addSegments(): void;
    _update(): void;
}

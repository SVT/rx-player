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
import { ICustomSourceBuffer } from "../../../../compat";
import AbstractSourceBuffer from "../../abstract_source_buffer";
export interface INativeTextTrackData {
    data: string;
    language: string;
    timescale: number;
    start: number;
    end?: number;
    type: string;
}
/**
 * SourceBuffer to display TextTracks in a <track> element, in the given
 * video element.
 * @class NativeTextSourceBuffer
 * @extends AbstractSourceBuffer
 */
export default class NativeTextSourceBuffer extends AbstractSourceBuffer<INativeTextTrackData> implements ICustomSourceBuffer<INativeTextTrackData> {
    private readonly _videoElement;
    private readonly _track;
    private readonly _trackElement?;
    /**
     * @param {HTMLMediaElement} videoElement
     * @param {Boolean} hideNativeSubtitle
     */
    constructor(videoElement: HTMLMediaElement, hideNativeSubtitle: boolean);
    /**
     * Append text tracks.
     * @param {Object} data
     */
    _append(data: INativeTextTrackData): void;
    /**
     * @param {Number} from
     * @param {Number} to
     */
    _remove(from: number, to: number): void;
    _abort(): void;
}

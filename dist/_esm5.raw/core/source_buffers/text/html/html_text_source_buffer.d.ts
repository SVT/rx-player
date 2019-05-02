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
import AbstractSourceBuffer from "../../abstract_source_buffer";
export interface IHTMLTextTrackData {
    timescale: number;
    start: number;
    end?: number;
    data: string;
    type: string;
    language: string;
}
/**
 * SourceBuffer to display TextTracks in the given HTML element.
 * @class HTMLTextSourceBuffer
 */
export default class HTMLTextSourceBuffer extends AbstractSourceBuffer<IHTMLTextTrackData> {
    private readonly _videoElement;
    private readonly _destroy$;
    private readonly _textTrackElement;
    private readonly _buffer;
    private _currentElement;
    /**
     * @param {HTMLMediaElement} videoElement
     * @param {HTMLElement} textTrackElement
     */
    constructor(videoElement: HTMLMediaElement, textTrackElement: HTMLElement);
    /**
     * Append text tracks.
     * @param {Object} data
     */
    _append(data: IHTMLTextTrackData): void;
    /**
     * @param {Number} from
     * @param {Number} to
     */
    _remove(from: number, to: number): void;
    /**
     * Free up ressources from this sourceBuffer
     */
    _abort(): void;
}

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
/**
 * Player state dictionnary
 * @type {Object}
 */
export declare const PLAYER_STATES: {
    STOPPED: string;
    LOADED: string;
    LOADING: string;
    PLAYING: string;
    PAUSED: string;
    ENDED: string;
    BUFFERING: string;
    SEEKING: string;
    RELOADING: string;
};
/**
 * Get state string for a _loaded_ content.
 * @param {HTMLMediaElement} mediaElement
 * @param {boolean} isPlaying - false when the player is paused. true otherwise.
 * @param {Object} stalledStatus - Current stalled state:
 *   - null when not stalled
 *   - an object with a description of the situation if stalled.
 * @returns {string}
 */
export default function getLoadedContentState(mediaElement: HTMLMediaElement, isPlaying: boolean, stalledStatus: {
    reason: "seeking" | "not-ready" | "buffering";
} | null): string;

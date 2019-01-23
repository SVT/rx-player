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
 * Calculate a mean bandwidth based on the bytes downloaded and the amount
 * of time needed to do so.
 *
 * Heavily "inspired" from the Shaka-Player's "ewma bandwidth estimator".
 * @class BandwidthEstimator
 */
export default class BandwidthEstimator {
    private _fastEWMA;
    private _slowEWMA;
    private _bytesSampled;
    constructor();
    /**
     * Takes a bandwidth sample.
     * @param {number} durationMs - The amount of time, in milliseconds, for a
     *   particular request.
     * @param {number} numBytes - The total number of bytes transferred in that
     *   request.
     */
    addSample(durationInMs: number, numberOfBytes: number): void;
    /**
     * Get estimate of the bandwidth, in bits per seconds.
     * @returns {Number|undefined}
     */
    getEstimate(): number | undefined;
    /**
     * Reset the bandwidth estimation.
     */
    reset(): void;
}

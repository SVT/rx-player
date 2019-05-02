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
import config from "../../config";
import EWMA from "./ewma";
var ABR_MINIMUM_TOTAL_BYTES = config.ABR_MINIMUM_TOTAL_BYTES, ABR_MINIMUM_CHUNK_SIZE = config.ABR_MINIMUM_CHUNK_SIZE, ABR_FAST_EMA = config.ABR_FAST_EMA, ABR_SLOW_EMA = config.ABR_SLOW_EMA;
/**
 * Calculate a mean bandwidth based on the bytes downloaded and the amount
 * of time needed to do so.
 *
 * Heavily "inspired" from the Shaka-Player's "ewma bandwidth estimator".
 * @class BandwidthEstimator
 */
var BandwidthEstimator = /** @class */ (function () {
    function BandwidthEstimator() {
        /**
         * A fast-moving average.
         * @private
         */
        this._fastEWMA = new EWMA(ABR_FAST_EMA);
        /**
         * A slow-moving average.
         * @private
         */
        this._slowEWMA = new EWMA(ABR_SLOW_EMA);
        /**
         * Number of bytes sampled.
         * @private
         */
        this._bytesSampled = 0;
    }
    /**
     * Takes a bandwidth sample.
     * @param {number} durationMs - The amount of time, in milliseconds, for a
     *   particular request.
     * @param {number} numBytes - The total number of bytes transferred in that
     *   request.
     */
    BandwidthEstimator.prototype.addSample = function (durationInMs, numberOfBytes) {
        if (numberOfBytes < ABR_MINIMUM_CHUNK_SIZE) {
            return;
        }
        var bandwidth = numberOfBytes * 8000 / durationInMs;
        var weight = durationInMs / 1000;
        this._bytesSampled += numberOfBytes;
        this._fastEWMA.addSample(weight, bandwidth);
        this._slowEWMA.addSample(weight, bandwidth);
    };
    /**
     * Get estimate of the bandwidth, in bits per seconds.
     * @returns {Number|undefined}
     */
    BandwidthEstimator.prototype.getEstimate = function () {
        if (this._bytesSampled < ABR_MINIMUM_TOTAL_BYTES) {
            return undefined;
        }
        // Take the minimum of these two estimates.  This should have the effect of
        // adapting down quickly, but up more slowly.
        return Math.min(this._fastEWMA.getEstimate(), this._slowEWMA.getEstimate());
    };
    /**
     * Reset the bandwidth estimation.
     */
    BandwidthEstimator.prototype.reset = function () {
        this._fastEWMA = new EWMA(ABR_FAST_EMA);
        this._slowEWMA = new EWMA(ABR_SLOW_EMA);
        this._bytesSampled = 0;
    };
    return BandwidthEstimator;
}());
export default BandwidthEstimator;

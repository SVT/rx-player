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
var DEFAULT_LIVE_GAP = config.DEFAULT_LIVE_GAP;
/**
 * Returns the calculated initial time for the content described by the given
 * Manifest:
 *   1. if a start time is defined by user, calculate starting time from the
 *      manifest informations
 *   2. else if the media is live, use the live edge and suggested delays from
 *      it
 *   3. else returns the minimum time announced in the manifest
 * @param {Manifest} manifest
 * @param {Object} startAt
 * @returns {Number}
 */
export default function getInitialTime(manifest, startAt) {
    if (startAt) {
        var _a = manifest.getCurrentPositionLimits(), min = _a[0], max = _a[1];
        if (startAt.position != null) {
            return Math.max(Math.min(startAt.position, max), min);
        }
        else if (startAt.wallClockTime != null) {
            var position = manifest.isLive ?
                startAt.wallClockTime - (manifest.availabilityStartTime || 0) :
                startAt.wallClockTime;
            return Math.max(Math.min(position, max), min);
        }
        else if (startAt.fromFirstPosition != null) {
            var fromFirstPosition = startAt.fromFirstPosition;
            return fromFirstPosition <= 0 ?
                min : Math.min(min + fromFirstPosition, max);
        }
        else if (startAt.fromLastPosition != null) {
            var fromLastPosition = startAt.fromLastPosition;
            return fromLastPosition >= 0 ?
                max : Math.max(min, max + fromLastPosition);
        }
        else if (startAt.percentage != null) {
            var percentage = startAt.percentage;
            if (percentage > 100) {
                return max;
            }
            else if (percentage < 0) {
                return min;
            }
            var ratio = +percentage / 100;
            var extent = max - min;
            return min + extent * ratio;
        }
    }
    if (manifest.isLive) {
        var sgp = manifest.suggestedPresentationDelay;
        return manifest.getMaximumPosition() -
            (sgp == null ? DEFAULT_LIVE_GAP : sgp);
    }
    return manifest.getMinimumPosition();
}

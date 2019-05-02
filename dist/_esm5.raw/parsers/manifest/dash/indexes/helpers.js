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
import resolveURL from "../../../../utils/resolve_url";
/**
 * Calculate the number of times a timeline element repeat.
 * @param {Object} element
 * @param {Object} nextElement
 * @param {number} timelineEnd
 * @returns {Number}
 */
function calculateRepeat(element, nextElement, timelineEnd) {
    var repeatCount = element.repeatCount;
    if (repeatCount >= 0) {
        return repeatCount;
    }
    // A negative value of the @r attribute of the S element indicates
    // that the duration indicated in @d attribute repeats until the
    // start of the next S element, the end of the Period or until the
    // next MPD update.
    var segmentEnd;
    if (nextElement != null) {
        segmentEnd = nextElement.start;
    }
    else if (timelineEnd != null) {
        segmentEnd = timelineEnd;
    }
    else {
        segmentEnd = Number.MAX_VALUE;
    }
    return Math.ceil((segmentEnd - element.start) / element.duration) - 1;
}
/**
 * Convert from `presentationTime`, the time of the segment at the moment it
 * is decoded to `mediaTime`, the original time the segments point at.
 * @param {Object} index
 * @param {number} time
 * @returns {number}
 */
function toIndexTime(index, time) {
    return time * index.timescale + index.indexTimeOffset;
}
/**
 * Convert from `mediaTime`, the original time the segments point at to
 * `presentationTime`, the time of the segment at the moment it is decoded.
 * @param {Object} index
 * @param {number} time
 * @returns {number}
 */
function fromIndexTime(index, time) {
    return (time - index.indexTimeOffset) / index.timescale;
}
/**
 * @param {Object} index
 * @param {Number} start
 * @param {Number} duration
 * @returns {Object} - Object with two properties:
 *   - up {Number}: timescaled timestamp of the beginning time
 *   - to {Number}: timescaled timestamp of the end time (start time + duration)
 */
function getTimescaledRange(index, start, duration) {
    var timescale = index.timescale || 1;
    return {
        up: (start) * timescale,
        to: (start + duration) * timescale,
    };
}
/**
 * @param {Object} segment
 * @param {Object|null} [nextSegment]
 * @param {number} timelineEnd
 * @returns {Number}
 */
function getIndexSegmentEnd(segment, nextSegment, timelineEnd) {
    var start = segment.start, duration = segment.duration;
    if (duration === -1) {
        return start;
    }
    var repeat = calculateRepeat(segment, nextSegment, timelineEnd);
    return start + (repeat + 1) * duration;
}
/**
 * Construct init segment for the given index.
 * @param {Object} index
 * @returns {Object}
 */
function getInitSegment(index) {
    var initialization = index.initialization;
    return {
        id: "init",
        isInit: true,
        time: 0,
        range: initialization ? initialization.range || undefined : undefined,
        indexRange: index.indexRange || undefined,
        mediaURL: initialization ? initialization.mediaURL : null,
        timescale: index.timescale,
        timestampOffset: -(index.indexTimeOffset / index.timescale),
    };
}
/**
 * For the given start time and duration of a timeline element, calculate how
 * much this element should be repeated to contain the time given.
 * 0 being the same element, 1 being the next one etc.
 * @param {Number} segmentStartTime
 * @param {Number} segmentDuration
 * @param {Number} wantedTime
 * @returns {Number}
 */
function getWantedRepeatIndex(segmentStartTime, segmentDuration, wantedTime) {
    var diff = wantedTime - segmentStartTime;
    if (diff > 0) {
        return Math.floor(diff / segmentDuration);
    }
    else {
        return 0;
    }
}
/**
 * Get a list of Segments for the time range wanted.
 * @param {Object} index - index object, constructed by parsing the manifest.
 * @param {number} from - starting timestamp wanted, in seconds
 * @param {number} durationWanted - duration wanted, in seconds
 * @returns {Array.<Object>}
 */
function getSegmentsFromTimeline(index, from, durationWanted) {
    var scaledUp = toIndexTime(index, from);
    var scaledTo = toIndexTime(index, from + durationWanted);
    var timeline = index.timeline, timescale = index.timescale, mediaURL = index.mediaURL, startNumber = index.startNumber, timelineEnd = index.timelineEnd;
    var currentNumber = startNumber != null ? startNumber : undefined;
    var segments = [];
    var timelineLength = timeline.length;
    // TODO(pierre): use @maxSegmentDuration if possible
    var maxEncounteredDuration = (timeline.length && timeline[0].duration) || 0;
    for (var i = 0; i < timelineLength; i++) {
        var timelineItem = timeline[i];
        var duration = timelineItem.duration, start = timelineItem.start, range = timelineItem.range;
        maxEncounteredDuration = Math.max(maxEncounteredDuration, duration);
        // live-added segments have @d attribute equals to -1
        if (duration < 0) {
            // what? May be to play it safe and avoid adding segments which are
            // not completely generated
            if (start + maxEncounteredDuration < scaledTo) {
                var segmentNumber = currentNumber != null ? currentNumber : undefined;
                var segment = {
                    id: "" + start,
                    time: start - index.indexTimeOffset,
                    isInit: false,
                    range: range,
                    duration: undefined,
                    timescale: timescale,
                    mediaURL: replaceSegmentDASHTokens(mediaURL, start, segmentNumber),
                    number: segmentNumber,
                    timestampOffset: -(index.indexTimeOffset / timescale),
                };
                segments.push(segment);
            }
            return segments;
        }
        var repeat = calculateRepeat(timelineItem, timeline[i + 1], timelineEnd);
        var segmentNumberInCurrentRange = getWantedRepeatIndex(start, duration, scaledUp);
        var segmentTime = start + segmentNumberInCurrentRange * duration;
        while (segmentTime < scaledTo && segmentNumberInCurrentRange <= repeat) {
            var segmentNumber = currentNumber != null ?
                currentNumber + segmentNumberInCurrentRange : undefined;
            var segment = {
                id: "" + segmentTime,
                time: segmentTime - index.indexTimeOffset,
                isInit: false,
                range: range,
                duration: duration,
                timescale: timescale,
                mediaURL: replaceSegmentDASHTokens(mediaURL, segmentTime, segmentNumber),
                number: segmentNumber,
                timestampOffset: -(index.indexTimeOffset / timescale),
            };
            segments.push(segment);
            // update segment number and segment time for the next segment
            segmentNumberInCurrentRange++;
            segmentTime = start + segmentNumberInCurrentRange * duration;
        }
        if (segmentTime >= scaledTo) {
            // we reached ``scaledTo``, we're done
            return segments;
        }
        if (currentNumber != null) {
            currentNumber += repeat + 1;
        }
    }
    return segments;
}
/**
 * Pad with 0 in the left of the given n argument to reach l length
 * @param {Number|string} n
 * @param {Number} l
 * @returns {string}
 */
function padLeft(n, l) {
    var nToString = n.toString();
    if (nToString.length >= l) {
        return nToString;
    }
    var arr = new Array(l + 1).join("0") + nToString;
    return arr.slice(-l);
}
function processFormatedToken(replacer) {
    return function (_match, _format, widthStr) {
        var width = widthStr ? parseInt(widthStr, 10) : 1;
        return padLeft("" + replacer, width);
    };
}
/**
 * @param {string} representationURL
 * @param {string|undefined} media
 * @param {string|undefined} id
 * @param {number|undefined} bitrate
 * @returns {string}
 */
function createIndexURL(representationURL, media, id, bitrate) {
    return replaceRepresentationDASHTokens(resolveURL(representationURL, media), id, bitrate);
}
/**
 * Replace "tokens" written in a given path (e.g. $RepresentationID$) by the corresponding
 * infos, taken from the given segment.
 * @param {string} path
 * @param {string|undefined} id
 * @param {number|undefined} bitrate
 * @returns {string}
 */
function replaceRepresentationDASHTokens(path, id, bitrate) {
    if (path.indexOf("$") === -1) {
        return path;
    }
    else {
        return path
            .replace(/\$\$/g, "$")
            .replace(/\$RepresentationID\$/g, String(id))
            .replace(/\$Bandwidth(|\%0(\d+)d)\$/g, processFormatedToken(bitrate || 0));
    }
}
/**
 * Replace "tokens" written in a given path (e.g. $Time$) by the corresponding
 * infos, taken from the given segment.
 * @param {string} path
 * @param {number} time
 * @param {number} number
 * @returns {string}
 *
 * @throws Error - Throws if we do not have enough data to construct the URL
 */
function replaceSegmentDASHTokens(path, time, number) {
    if (path.indexOf("$") === -1) {
        return path;
    }
    else {
        return path
            .replace(/\$\$/g, "$")
            .replace(/\$Number(|\%0(\d+)d)\$/g, function (_x, _y, widthStr) {
            if (number == null) {
                throw new Error("Segment number not defined in a $Number$ scheme");
            }
            return processFormatedToken(number)(_x, _y, widthStr);
        })
            .replace(/\$Time(|\%0(\d+)d)\$/g, function (_x, _y, widthStr) {
            if (time == null) {
                throw new Error("Segment time not defined in a $Time$ scheme");
            }
            return processFormatedToken(time)(_x, _y, widthStr);
        });
    }
}
export { calculateRepeat, createIndexURL, fromIndexTime, getIndexSegmentEnd, getInitSegment, getSegmentsFromTimeline, getTimescaledRange, replaceRepresentationDASHTokens, replaceSegmentDASHTokens, toIndexTime, };

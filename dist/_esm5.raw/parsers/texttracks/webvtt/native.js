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
 * /!\ This file is feature-switchable.
 * It always should be imported through the `features` object.
 */
import { isVTTCue, makeVTTCue, } from "../../../compat/index";
import arrayIncludes from "../../../utils/array_includes";
import getCueBlocks from "./get_cue_blocks";
import parseCueBlock from "./parse_cue_block";
import { getFirstLineAfterHeader } from "./utils";
// Simple VTT to ICompatVTTCue parser:
// Just parse cues and associated settings.
// Does not take into consideration STYLE and REGION blocks.
/**
 * Parse whole WEBVTT file into an array of cues, to be inserted in a video's
 * TrackElement.
 * @param {string} vttStr
 * @param {Number} timeOffset
 * @returns {Array.<ICompatVTTCue|TextTrackCue>}
 */
export default function parseVTTStringToVTTCues(vttStr, timeOffset) {
    // WEBVTT authorize CRLF, LF or CR as line terminators
    var lines = vttStr.split(/\r\n|\n|\r/);
    if (!(/^WEBVTT($| |\t)/.test(lines[0]))) {
        throw new Error("Can't parse WebVTT: Invalid file.");
    }
    var firstLineAfterHeader = getFirstLineAfterHeader(lines);
    var cueBlocks = getCueBlocks(lines, firstLineAfterHeader);
    var cues = [];
    for (var i = 0; i < cueBlocks.length; i++) {
        var cueObject = parseCueBlock(cueBlocks[i], timeOffset);
        if (cueObject != null) {
            var nativeCue = toNativeCue(cueObject);
            if (nativeCue != null) {
                if (isVTTCue(nativeCue)) {
                    setSettingsOnCue(cueObject.settings, nativeCue);
                }
                cues.push(nativeCue);
            }
        }
    }
    return cues;
}
/**
 * @param {Object} cue Object
 * @returns {TextTrackCue|ICompatVTTCue|null}
 */
function toNativeCue(cueObj) {
    var start = cueObj.start, end = cueObj.end, payload = cueObj.payload;
    var text = payload.join("\n");
    return makeVTTCue(start, end, text);
}
/**
 * Add the corresponding settings on the given cue.
 * /!\ Mutates the cue given.
 * @param {Object} settings - settings for the cue, as a key-value object.
 * @param {ICompatVTTCue|TextTrackCue} cue
 */
function setSettingsOnCue(settings, cue) {
    if (settings.vertical &&
        (settings.vertical === "rl" || settings.vertical === "lr")) {
        cue.vertical = settings.vertical;
    }
    if (settings.line) {
        /**
         * Capture groups:
         *   1 -> percentage position
         *   2 -> optional decimals from percentage position
         *   3 -> optional follow-up of the string indicating alignment value
         *   4 -> alignment value
         * @type {RegExp}
         */
        var percentagePosition = /^(\d+(\.\d+)?)%(,([a-z]+))?/;
        var percentageMatches = settings.line.match(percentagePosition);
        if (percentageMatches) {
            cue.line = Number(percentageMatches[1]);
            cue.snapToLines = false;
            if (arrayIncludes(["start", "center", "end"], percentageMatches[4])) {
                cue.lineAlign = percentageMatches[4];
            }
        }
        else {
            /**
             * Capture groups:
             *   1 -> line number
             *   2 -> optional follow-up of the string indicating alignment value
             *   3 -> alignment value
             * @type {RegExp}
             */
            var linePosition = /^(-?\d+)(,([a-z]+))?/;
            var lineMatches = settings.line.match(linePosition);
            if (lineMatches) {
                cue.line = Number(lineMatches[1]);
                cue.snapToLines = true;
                if (arrayIncludes(["start", "center", "end"], lineMatches[3])) {
                    cue.lineAlign = lineMatches[3];
                }
            }
        }
    }
    if (settings.position) {
        var positionRegex = /^([\d\.]+)%(?:,(line-left|line-right|center))?$/;
        var positionArr = positionRegex.exec(settings.position);
        if (positionArr && positionArr.length >= 2) {
            var position = parseInt(positionArr[1], 10);
            if (!isNaN(position)) {
                cue.position = position;
                if (positionArr[2] != null) {
                    cue.positionAlign = positionArr[2];
                }
            }
        }
    }
    if (settings.size) {
        cue.size = settings.size;
    }
    if (settings.align &&
        arrayIncludes(["start", "center", "end", "left"], settings.align)) {
        cue.align = settings.align;
    }
}

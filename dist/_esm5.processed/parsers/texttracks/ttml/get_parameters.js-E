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
 * Returns global parameters from a TTML Document
 * @param {Element} tt - <tt> node
 * @throws Error - Throws if the spacing style is invalid.
 * @returns {Object}
 */
export default function getParameters(tt) {
    var parsedFrameRate = tt.getAttribute("ttp:frameRate");
    var parsedSubFrameRate = tt.getAttribute("ttp:subFramRate");
    var parsedTickRate = tt.getAttribute("ttp:tickRate");
    var parsedFrameRateMultiplier = tt.getAttribute("ttp:frameRateMultiplier");
    var parsedSpaceStyle = tt.getAttribute("xml:space");
    if (parsedSpaceStyle && parsedSpaceStyle !== "default" &&
        parsedSpaceStyle !== "preserve") {
        throw new Error("Invalid spacing style");
    }
    var nbFrameRate = Number(parsedFrameRate) || 30;
    var nbSubFrameRate = Number(parsedSubFrameRate) || 1;
    var nbTickRate = Number(parsedTickRate) || 0;
    var tickRate = nbTickRate;
    var frameRate = nbFrameRate;
    var subFrameRate = nbSubFrameRate != null ? nbSubFrameRate : 1;
    // TypeScript too dumdum here :/
    var spaceStyle = (parsedSpaceStyle || "default");
    if (nbTickRate === 0) {
        tickRate = parsedFrameRate ? nbFrameRate * nbSubFrameRate : 1;
    }
    if (parsedFrameRateMultiplier) {
        var multiplierResults = /^(\d+) (\d+)$/g.exec(parsedFrameRateMultiplier);
        if (multiplierResults) {
            var numerator = Number(multiplierResults[1]);
            var denominator = Number(multiplierResults[2]);
            var multiplierNum = numerator / denominator;
            frameRate = nbFrameRate * multiplierNum;
        }
    }
    return {
        tickRate: tickRate,
        frameRate: frameRate,
        subFrameRate: subFrameRate,
        spaceStyle: spaceStyle,
    };
}

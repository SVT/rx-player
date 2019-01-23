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
// XML-Schema
/* tslint:disable:max-line-length */
// <http://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-DASH_schema_files/DASH-MPD.xsd>
/* tslint:enable:max-line-length */
import assert from "../../../../utils/assert";
var iso8601Duration = /^P(([\d.]*)Y)?(([\d.]*)M)?(([\d.]*)D)?T?(([\d.]*)H)?(([\d.]*)M)?(([\d.]*)S)?/;
var rangeRe = /([0-9]+)-([0-9]+)/;
/**
 * Parse MPD string attributes.
 * @param {string} str
 * @returns {string} - the same string
 */
function parseString(str) {
    return str;
}
/**
 * Parse MPD boolean attributes.
 * @param {string} str
 * @returns {Boolean}
 */
function parseBoolean(str) {
    return str === "true";
}
/**
 * Parse some MPD attributes.
 * @param {string} str
 * @returns {Boolean|Number}
 */
function parseIntOrBoolean(str) {
    if (str === "true") {
        return true;
    }
    if (str === "false") {
        return false;
    }
    return parseInt(str, 10);
}
/**
 * Parse MPD date attributes.
 * @param {string} str
 * @returns {Date}
 */
function parseDateTime(str) {
    return new Date(Date.parse(str)).getTime() / 1000;
}
/**
 * Parse MPD ISO8601 duration attributes into seconds.
 * @param {string} date
 * @returns {Number}
 */
function parseDuration(date) {
    if (!date) {
        return 0;
    }
    var match = iso8601Duration.exec(date);
    assert(!!match, date + " is not a valid ISO8601 duration");
    return (parseFloat(match[2] || "0") * 365 * 24 * 60 * 60 +
        parseFloat(match[4] || "0") * 30 * 24 * 60 * 60 + // not precise +
        parseFloat(match[6] || "0") * 24 * 60 * 60 +
        parseFloat(match[8] || "0") * 60 * 60 +
        parseFloat(match[10] || "0") * 60 +
        parseFloat(match[12] || "0"));
}
/**
 * Parse MPD ratio attributes.
 * @param {string} str
 * @returns {string}
 */
function parseRatio(str) {
    return str;
}
/**
 * Parse MPD byterange attributes into arrays of two elements: the start and
 * the end.
 * @param {string} str
 * @returns {Array.<Number>}
 */
function parseByteRange(str) {
    var match = rangeRe.exec(str);
    if (!match) {
        return null;
    }
    else {
        return [+match[1], +match[2]];
    }
}
/**
 * @param {Element} root
 * @returns {Object}
 */
function parseScheme(root) {
    var schemeIdUri;
    var value;
    for (var i = 0; i < root.attributes.length; i++) {
        var attribute = root.attributes[i];
        switch (attribute.name) {
            case "schemeIdUri":
                schemeIdUri = attribute.value;
                break;
            case "value":
                value = attribute.value;
                break;
        }
    }
    return {
        schemeIdUri: schemeIdUri,
        value: value,
    };
}
export { parseBoolean, parseByteRange, parseDateTime, parseDuration, parseIntOrBoolean, parseRatio, parseScheme, parseString, };

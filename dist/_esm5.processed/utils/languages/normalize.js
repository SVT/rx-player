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
import ISO_MAP_1_TO_3 from "./ISO_639-1_to_ISO_639-3";
import ISO_MAP_2_TO_3 from "./ISO_639-2_to_ISO_639-3";
/**
 * Normalize language given.
 * Basically:
 *   - converts it to lowercase.
 *   - normalize "base" (what is before the possible first "-") to an ISO639-3
 *     compatible string.
 * @param {string} _language
 * @returns {string}
 */
function normalizeLanguage(_language) {
    if (_language == null || _language === "") {
        return "";
    }
    var fields = ("" + _language).toLowerCase().split("-");
    var base = fields[0];
    var normalizedBase = normalizeBase(base);
    if (normalizedBase) {
        return normalizedBase;
    }
    return _language;
}
/**
 * Normalize language into an ISO639-3 format.
 * Returns undefined if it failed to do so
 * @param {string} base
 * @returns {string}
 */
function normalizeBase(base) {
    var result;
    switch (base.length) {
        case 2:
            result = ISO_MAP_1_TO_3[base];
            break;
        case 3:
            result = ISO_MAP_2_TO_3[base];
            break;
    }
    return result;
}
/**
 * Normalize text track from a user given input into an object
 * with three properties:
 *   - language {string}: The language the user gave us
 *   - normalized {string}: An attempt to normalize the language into an
 *     ISO 639-3 code
 *   - closedCaption {Boolean}: Whether the track is a closed caption track
 * @param {Object|string|null|undefined} _language
 * @returns {Object|null|undefined}
 */
function normalizeTextTrack(_language) {
    if (_language != null) {
        var language = void 0;
        var closedCaption = void 0;
        if (typeof _language === "string") {
            language = _language;
            closedCaption = false;
        }
        else {
            language = _language.language;
            closedCaption = !!_language.closedCaption;
        }
        return {
            language: language,
            closedCaption: closedCaption,
            normalized: normalizeLanguage(language),
        };
    }
    return _language;
}
/**
 * Normalize audio track from a user given input into an object
 * with three properties:
 *   - language {string}: The language the user gave us
 *   - normalized {string}: An attempt to normalize the language into an
 *     ISO 639-3 code
 *   - audioDescription {Boolean}: Whether the track is a closed caption track
 * @param {Object|string|null|undefined} _language
 * @returns {Object|null|undefined}
 */
function normalizeAudioTrack(_language) {
    if (_language != null) {
        var language = void 0;
        var audioDescription = void 0;
        if (typeof _language === "string") {
            language = _language;
            audioDescription = false;
        }
        else {
            language = _language.language;
            audioDescription = !!_language.audioDescription;
        }
        return {
            language: language,
            audioDescription: audioDescription,
            normalized: normalizeLanguage(language),
        };
    }
    return _language;
}
export default normalizeLanguage;
export { normalizeAudioTrack, normalizeTextTrack, };

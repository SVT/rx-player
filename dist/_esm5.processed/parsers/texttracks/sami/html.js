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
// __VERY__ simple SAMI parser, based on ugly-but-working REGEXP:
//   - the text, start and end times are correctly parsed.
//   - only text for the given language is parsed.
//   - only the CSS style associated to the P element is set.
//   - we should be safe for any XSS.
// The language indicated to the parser should be present in the CSS and the
// corresponding Class should be on the P elements. If we fail to find the
// language in a "lang" property of a CSS class, the parser will throw.
/**
 * /!\ This file is feature-switchable.
 * It always should be imported through the `features` object.
 */
import assert from "../../../utils/assert";
var HTML_ENTITIES = /&#([0-9]+);/g;
var BR = /<br>/gi;
var STYLE = /<style[^>]*>([\s\S]*?)<\/style[^>]*>/i;
var PARAG = /\s*<p class=([^>]+)>(.*)/i;
var START = /<sync[^>]+?start="?([0-9]*)"?[^0-9]/i;
/**
 * Returns classnames for every languages.
 * @param {string} str
 * @returns {Object}
 */
function getClassNameByLang(str) {
    var ruleRe = /\.(\S+)\s*{([^}]*)}/gi;
    var langs = {};
    var m;
    while ((m = ruleRe.exec(str))) {
        var name_1 = m[1];
        var lang = getCSSProperty(m[2], "lang");
        if (name_1 != null && lang != null) {
            langs[lang] = name_1;
        }
    }
    return langs;
}
/**
 * Returns the rules defined for the P element.
 * Empty string if not found.
 * @param {string} str - The entire styling part.
 * @returns {string}
 */
function getPCSSRules(str) {
    var pRuleRegex = /p\s*{([^}]*)}/gi;
    var rule = pRuleRegex.exec(str);
    if (!rule) {
        return "";
    }
    return rule[1];
}
/**
 * @param {string} str - entire CSS rule
 * @param {string} name - name of the property
 * @returns {string|null} - value of the property. Null if not found.
 */
function getCSSProperty(str, name) {
    var matches = str.match(new RegExp("\\s*" + name + ":\\s*(\\S+);", "i"));
    return matches ? matches[1] : null;
}
/**
 * @param {string} text
 * @returns {string}
 */
function decodeEntities(text) {
    return text
        .replace(HTML_ENTITIES, function (_, $1) { return String.fromCharCode($1); });
}
/**
 * Because sami is not really html... we have to use
 * some kind of regular expressions to parse it...
 * the cthulhu way :)
 * The specification being quite clunky, this parser
 * may not work for every sami input.
 *
 * @param {string} smi
 * @param {Number} timeOffset
 * @param {string} lang
 */
function parseSami(smi, timeOffset, lang) {
    var syncOpen = /<sync[ >]/ig;
    var syncClose = /<sync[ >]|<\/body>/ig;
    var subs = [];
    var styleMatches = smi.match(STYLE);
    var css = styleMatches ? styleMatches[1] : "";
    var up;
    var to;
    // FIXME Is that wanted?
    // previously written as let to = SyncClose.exec(smi); but never used
    syncClose.exec(smi);
    var langs = getClassNameByLang(css);
    var pCSS = getPCSSRules(css);
    var klass = lang && langs[lang];
    assert(!!klass, "sami: could not find lang " + lang + " in CSS");
    while (true) {
        up = syncOpen.exec(smi);
        to = syncClose.exec(smi);
        if (!up && !to) {
            break;
        }
        if (!up || !to || up.index >= to.index) {
            throw new Error("parse error");
        }
        var str = smi.slice(up.index, to.index);
        var tim = str.match(START);
        if (!tim) {
            throw new Error("parse error (sync time attribute)");
        }
        var start = +tim[1];
        if (isNaN(start)) {
            throw new Error("parse error (sync time attribute NaN)");
        }
        appendToSubs(str.split("\n"), start / 1000);
    }
    return subs;
    function appendToSubs(lines, start) {
        var i = lines.length;
        while (--i >= 0) {
            var paragraphInfos = lines[i].match(PARAG);
            if (!paragraphInfos) {
                continue;
            }
            var className = paragraphInfos[1], txt = paragraphInfos[2];
            if (klass !== className) {
                continue;
            }
            if (txt === "&nbsp;") {
                subs[subs.length - 1].end = start;
            }
            else {
                var wrapperEl = document.createElement("DIV");
                wrapperEl.className = "rxp-texttrack-region";
                var divEl = document.createElement("DIV");
                divEl.className = "rxp-texttrack-div";
                divEl.style.position = "absolute";
                divEl.style.bottom = "0";
                divEl.style.width = "100%";
                divEl.style.color = "#fff";
                divEl.style.textShadow = "-1px -1px 0 #000," +
                    "1px -1px 0 #000," +
                    "-1px 1px 0 #000," +
                    "1px 1px 0 #000";
                var pEl = document.createElement("div");
                pEl.className = "rxp-texttrack-p";
                if (pCSS) {
                    pEl.style.cssText = pCSS;
                }
                var textEls = txt.split(BR);
                for (var j = 0; j < textEls.length; j++) {
                    if (j) {
                        pEl.appendChild(document.createElement("BR"));
                    }
                    var spanEl = document.createElement("SPAN");
                    spanEl.className = "rxp-texttrack-span";
                    spanEl.textContent = decodeEntities(textEls[j]);
                    pEl.appendChild(spanEl);
                }
                divEl.appendChild(pEl);
                wrapperEl.appendChild(divEl);
                subs.push({
                    element: wrapperEl,
                    start: start + timeOffset,
                    end: -1,
                });
            }
        }
    }
}
export default parseSami;

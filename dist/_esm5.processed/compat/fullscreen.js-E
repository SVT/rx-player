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
 * Request fullScreen action on a given element.
 * @param {HTMLElement} elt
 * rs-detect)
 */
function requestFullscreen(element) {
    if (!isFullscreen()) {
        var elt = element;
        if (elt.requestFullscreen) {
            /* tslint:disable no-floating-promises */
            elt.requestFullscreen();
            /* tslint:enable no-floating-promises */
        }
        else if (elt.msRequestFullscreen) {
            elt.msRequestFullscreen();
        }
        else if (elt.mozRequestFullScreen) {
            elt.mozRequestFullScreen();
        }
        else if (elt.webkitRequestFullscreen) {
            elt.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    }
}
/**
 * Exit fullscreen if an element is currently in fullscreen.
 */
function exitFullscreen() {
    if (isFullscreen()) {
        var doc = document;
        if (doc.exitFullscreen) {
            /* tslint:disable no-floating-promises */
            doc.exitFullscreen();
            /* tslint:enable no-floating-promises */
        }
        else if (doc.msExitFullscreen) {
            doc.msExitFullscreen();
        }
        else if (doc.mozCancelFullScreen) {
            doc.mozCancelFullScreen();
        }
        else if (doc.webkitExitFullscreen) {
            doc.webkitExitFullscreen();
        }
    }
}
/**
 * Returns true if an element in the document is being displayed in fullscreen
 * mode;
 * otherwise it's false.
 * @returns {boolean}
 */
function isFullscreen() {
    var doc = document;
    return !!(doc.fullscreenElement ||
        doc.mozFullScreenElement ||
        doc.webkitFullscreenElement ||
        doc.msFullscreenElement);
}
export { requestFullscreen, exitFullscreen, isFullscreen, };

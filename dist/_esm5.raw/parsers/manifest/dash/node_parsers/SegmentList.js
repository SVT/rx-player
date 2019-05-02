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
import objectAssign from "object-assign";
import parseSegmentBase from "./SegmentBase";
import parseSegmentURL from "./SegmentURL";
/**
 * @param {Element} root
 * @returns {Object}
 */
export default function parseSegmentList(root) {
    var base = parseSegmentBase(root);
    var list = [];
    var segmentListChildren = root.childNodes;
    for (var i = 0; i < segmentListChildren.length; i++) {
        if (segmentListChildren[i].nodeType === Node.ELEMENT_NODE) {
            var currentNode = segmentListChildren[i];
            if (currentNode.nodeName === "SegmentURL") {
                var segmentURL = parseSegmentURL(currentNode);
                list.push(segmentURL);
            }
        }
    }
    var baseDuration = base.duration;
    if (baseDuration == null) {
        throw new Error("Invalid SegmentList: no duration");
    }
    return objectAssign(base, {
        list: list,
        duration: baseDuration,
    });
}

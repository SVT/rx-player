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
 * Parse C nodes to build index timeline.
 * @param {Element} nodes
 */
export default function parseCNodes(nodes) {
    return nodes.reduce(function (timeline, node, i) {
        var dAttr = node.getAttribute("d");
        var tAttr = node.getAttribute("t");
        var rAttr = node.getAttribute("r");
        var repeatCount = rAttr ? +rAttr - 1 : 0;
        var start = tAttr ? +tAttr : undefined;
        var duration = dAttr ? +dAttr : undefined;
        if (i === 0) { // first node
            start = start || 0;
        }
        else { // from second node to the end
            var prev = timeline[i - 1];
            if (start == null || isNaN(start)) {
                if (prev.duration == null || isNaN(prev.duration)) {
                    throw new Error("Smooth: Invalid CNodes. Missing timestamp.");
                }
                start = prev.start + prev.duration * (prev.repeatCount + 1);
            }
        }
        if (duration == null || isNaN(duration)) {
            var nextNode = nodes[i + 1];
            if (nextNode) {
                var nextTAttr = nextNode.getAttribute("t");
                var nextStart = nextTAttr ? +nextTAttr : null;
                if (nextStart === null) {
                    throw new Error("Can't build index timeline from Smooth Manifest.");
                }
                duration = nextStart - start;
            }
            else {
                return timeline;
            }
        }
        timeline.push({ duration: duration, start: start, repeatCount: repeatCount });
        return timeline;
    }, []);
}

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
import arrayIncludes from "../../../../utils/array_includes";
/**
 * Construct an HTMLElement/TextNode representing the given node and apply
 * the right styling on it.
 * @param {Node} baseNode
 * @param {Array.<Object>} styleElements
 * @param {Array.<string>} styleClasses
 * @returns {Node}
 */
function createStyledElement(baseNode, styleElements, styleClasses) {
    var HTMLTags = ["u", "i", "b"];
    var authorizedNodeNames = ["u", "i", "b", "c", "#text"];
    var mainNodeName = baseNode.nodeName.toLowerCase().split(".")[0];
    var nodeWithStyle;
    if (arrayIncludes(authorizedNodeNames, mainNodeName)) {
        if (mainNodeName === "#text") {
            var linifiedText = baseNode.wholeText
                .split("\n");
            nodeWithStyle = document.createElement("span");
            for (var i = 0; i < linifiedText.length; i++) {
                if (i) {
                    nodeWithStyle.appendChild(document.createElement("br"));
                }
                if (linifiedText[i].length > 0) {
                    var textNode = document.createTextNode(linifiedText[i]);
                    nodeWithStyle.appendChild(textNode);
                }
            }
        }
        else {
            var nodeClasses = baseNode.nodeName.toLowerCase().split(".");
            var classIndexes_1 = [];
            nodeClasses.forEach(function (nodeClass) {
                if (styleClasses.indexOf(nodeClass) !== -1) {
                    classIndexes_1.push(styleClasses.indexOf(nodeClass));
                }
            });
            if (classIndexes_1.length !== 0) { // If style must be applied
                var attr_1 = document.createAttribute("style");
                classIndexes_1.forEach(function (index) {
                    if (styleElements[index]) {
                        attr_1.value += styleElements[index].styleContent;
                    }
                });
                var nameClass = arrayIncludes(HTMLTags, mainNodeName) ?
                    mainNodeName : "span";
                nodeWithStyle = document.createElement(nameClass);
                nodeWithStyle.setAttributeNode(attr_1);
            }
            else { // If style mustn't be applied. Rebuild element with tag name
                var elementTag = !arrayIncludes(HTMLTags, mainNodeName) ?
                    "span" : mainNodeName;
                nodeWithStyle = document.createElement(elementTag);
            }
            for (var j = 0; j < baseNode.childNodes.length; j++) {
                var child = createStyledElement(baseNode.childNodes[j], styleElements, styleClasses);
                nodeWithStyle.appendChild(child);
            }
        }
    }
    else {
        nodeWithStyle = document.createElement("span");
        for (var j = 0; j < baseNode.childNodes.length; j++) {
            var child = createStyledElement(baseNode.childNodes[j], styleElements, styleClasses);
            nodeWithStyle.appendChild(child);
        }
    }
    return nodeWithStyle;
}
/**
 * @param {string} text
 * @param {Array.<Object>} styleElements
 * @returns {Array.<HTMLElement>}
 */
export default function convertPayloadToHTML(text, styleElements) {
    var styleClasses = styleElements
        .map(function (styleElement) { return styleElement.className; })
        .filter(function (className) { return className != null; });
    var filteredText = text
        // Remove timestamp tags
        .replace(/<[0-9]{2}:[0-9]{2}.[0-9]{3}>/, "")
        // Remove tag content or attributes (e.g. <b dfgfdg> => <b>)
        .replace(/<([u,i,b,c])(\..*?)?(?: .*?)?>(.*?)<\/\1>/g, "<$1$2>$3</$1$2>");
    var parsedWebVTT = new DOMParser().parseFromString(filteredText, "text/html");
    var nodes = parsedWebVTT.body.childNodes;
    var styledElements = [];
    for (var i = 0; i < nodes.length; i++) {
        styledElements.push(createStyledElement(nodes[i], styleElements, styleClasses));
    }
    return styledElements;
}

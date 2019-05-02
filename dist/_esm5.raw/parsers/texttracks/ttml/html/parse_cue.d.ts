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
import { ITTParameters } from "../get_parameters";
import { IStyleList, IStyleObject } from "../get_styling";
export interface ITTMLHTMLCue {
    start: number;
    end: number;
    element: HTMLElement;
}
/**
 * @param {Element} paragraph
 * @param {Number} offset
 * @param {Array.<Object>} styles
 * @param {Array.<Object>} regions
 * @param {Element} body
 * @param {Object} styleBase
 * @param {Object} ttParams
 * @param {Boolean} shouldTrimWhiteSpaceOnParagraph
 * @returns {Object|null}
 */
export default function parseCue(paragraph: Element, offset: number, styles: IStyleObject[], regions: IStyleObject[], body: Element | null, styleBase: IStyleList, ttParams: ITTParameters, shouldTrimWhiteSpace: boolean): ITTMLHTMLCue | null;

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
import { IParsedManifest } from "../types";
export declare type IResource = {
    type: 'xlink' | 'http-iso';
    url: string;
};
export declare type IParserResponse<T> = {
    type: "needs-ressources";
    value: {
        ressources: IResource[];
        continue: (loadedRessources: string[]) => IParserResponse<T>;
    };
} | {
    type: "done";
    value: T;
};
/**
 * @param {Element} root - The MPD root.
 * @param {string} url - The url where the MPD is located
 * @returns {Object}
 */
export default function parseMPD(root: Element, uri: string): IParserResponse<IParsedManifest>;

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
import { IKeySystem } from "./parse_protection_node";
export interface IHSSParserConfiguration {
    aggressiveMode?: boolean;
    suggestedPresentationDelay?: number;
    referenceDateTime?: number;
    minRepresentationBitrate?: number;
    keySystems?: (hex?: Uint8Array) => IKeySystem[];
}
/**
 * @param {Object|undefined} parserOptions
 * @returns {Function}
 */
declare function createSmoothStreamingParser(parserOptions?: IHSSParserConfiguration): (manifest: Document, url: string, manifestReceivedTime?: number) => IParsedManifest;
export default createSmoothStreamingParser;

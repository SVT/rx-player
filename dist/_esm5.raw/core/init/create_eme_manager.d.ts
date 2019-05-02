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
import { Observable } from "rxjs";
import { IEMEManagerEvent, IKeySystemOption } from "../eme";
export interface IEMEDisabledEvent {
    type: "eme-disabled";
}
/**
 * Create EMEManager if possible (has the APIs and configuration).
 * Else, return an Observable throwing at the next encrypted event encountered.
 * @param {HTMLMediaElement} mediaElement
 * @param {Array.<Object>} keySystems
 * @returns {Observable}
 */
export default function createEMEManager(mediaElement: HTMLMediaElement, keySystems: IKeySystemOption[]): Observable<IEMEManagerEvent | IEMEDisabledEvent>;
export { IEMEManagerEvent };

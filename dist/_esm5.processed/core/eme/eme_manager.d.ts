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
import { IEMEInitEvent, IEMEWarningEvent, IKeySystemOption } from "./types";
/**
 * Clear EME ressources that should be cleared when the current content stops
 * its playback.
 * @returns {Observable}
 */
declare function clearEMESession(mediaElement: HTMLMediaElement): Observable<never>;
export declare type IEMEManagerEvent = IEMEWarningEvent | IEMEInitEvent;
/**
 * EME abstraction and event handler used to communicate with the Content-
 * Description-Module (CDM).
 *
 * The EME handler can be given one or multiple systems and will choose the
 * appropriate one supported by the user's browser.
 * @param {HTMLMediaElement} mediaElement
 * @param {Array.<Object>} keySystems
 * @returns {Observable}
 */
export default function EMEManager(mediaElement: HTMLMediaElement, keySystemsConfigs: IKeySystemOption[]): Observable<IEMEManagerEvent>;
/**
 * Free up all ressources taken by the EME management.
 */
declare function disposeEME(mediaElement: HTMLMediaElement): void;
/**
 * Returns the name of the current key system used.
 * @returns {string}
 */
declare function getCurrentKeySystem(mediaElement: HTMLMediaElement): string | null;
export { clearEMESession, disposeEME, getCurrentKeySystem, };

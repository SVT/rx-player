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
 * /!\ This file is feature-switchable.
 * It always should be imported through the `features` object.
 */
import { Observable } from "rxjs";
import { IKeySystemOption } from "../eme";
import { IInitialTimeOptions } from "./get_initial_time";
import { IInitClockTick, ILoadedEvent, ISpeedChangedEvent, IStalledEvent, IWarningEvent } from "./types";
export interface IDirectFileOptions {
    autoPlay: boolean;
    clock$: Observable<IInitClockTick>;
    keySystems: IKeySystemOption[];
    mediaElement: HTMLMediaElement;
    speed$: Observable<number>;
    startAt?: IInitialTimeOptions;
    url: string;
}
export declare type IDirectfileEvent = ISpeedChangedEvent | IStalledEvent | ILoadedEvent | IWarningEvent;
/**
 * Launch a content in "Directfile mode".
 * @param {Object} directfileOptions
 * @returns {Observable}
 */
export default function initializeDirectfileContent({ autoPlay, clock$, keySystems, mediaElement, speed$, startAt, url, }: IDirectFileOptions): Observable<IDirectfileEvent>;

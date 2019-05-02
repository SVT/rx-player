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
import { ICustomError } from "../../errors";
import Manifest, { Period } from "../../manifest";
import ABRManager from "../abr";
import { IRepresentationChangeEvent } from "../buffers";
import { IBufferType } from "../source_buffers";
import { IStallingItem } from "./get_stalled_events";
import { ILoadedEvent, IManifestReadyEvent, IReloadingMediaSourceEvent, ISpeedChangedEvent, IStalledEvent, IWarningEvent } from "./types";
/**
 * Construct a "loaded" event.
 * @returns {Object}
 */
declare function loaded(): ILoadedEvent;
/**
 * Construct a "stalled" event.
 * @param {Object|null} stalling
 * @returns {Object}
 */
declare function stalled(stalling: IStallingItem | null): IStalledEvent;
/**
 * Construct a "manifestReady" event.
 * @param {Object} abrManager
 * @param {Object} manifest
 * @returns {Object}
 */
declare function manifestReady(abrManager: ABRManager, manifest: Manifest): IManifestReadyEvent;
/**
 * Construct a "speedChanged" event.
 * @param {Number} speed
 * @returns {Object}
 */
declare function speedChanged(speed: number): ISpeedChangedEvent;
/**
 * Construct a "representationChange" event.
 * @param {string} type
 * @param {Object} period
 * @returns {Object}
 */
declare function nullRepresentation(type: IBufferType, period: Period): IRepresentationChangeEvent;
/**
 * Construct a "warning" event.
 * @param {Error} value
 * @returns {Object}
 */
declare function warning(value: Error | ICustomError): IWarningEvent;
declare function reloadingMediaSource(): IReloadingMediaSourceEvent;
declare const INIT_EVENTS: {
    loaded: typeof loaded;
    manifestReady: typeof manifestReady;
    nullRepresentation: typeof nullRepresentation;
    reloadingMediaSource: typeof reloadingMediaSource;
    speedChanged: typeof speedChanged;
    stalled: typeof stalled;
    warning: typeof warning;
};
export default INIT_EVENTS;

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
export interface IEventEmitter<T> {
    addEventListener<TEventName extends keyof T>(evt: TEventName, fn: IListener<T, TEventName>): void;
    removeEventListener<TEventName extends keyof T>(evt: TEventName, fn: IListener<T, TEventName>): void;
    trigger?<TEventName extends keyof T>(evt: TEventName, arg: IArgs<T, TEventName>): void;
}
declare type IArgs<TEventRecord, TEventName extends keyof TEventRecord> = TEventRecord[TEventName];
declare type IListener<TEventRecord, TEventName extends keyof TEventRecord> = (args: IArgs<TEventRecord, TEventName>) => void;
/**
 * Simple but fully type-safe EventEmitter implementation.
 * @class EventEmitter
 */
export default class EventEmitter<T> implements IEventEmitter<T> {
    /**
     * @type {Object}
     * @private
     */
    private _listeners;
    constructor();
    /**
     * Register a new callback for an event.
     *
     * @param {string} evt - The event to register a callback to
     * @param {Function} fn - The callback to call as that event is triggered.
     * The callback will take as argument the eventual payload of the event
     * (single argument).
     */
    addEventListener<TEventName extends keyof T>(evt: TEventName, fn: IListener<T, TEventName>): void;
    /**
     * Unregister callbacks linked to events.
     * @param {string} [evt] - The event for which the callback[s] should be
     * unregistered. Set it to null or undefined to remove all callbacks
     * currently registered (for any event).
     * @param {Function} [fn] - The callback to unregister. If set to null
     * or undefined while the evt argument is set, all callbacks linked to that
     * event will be unregistered.
     */
    removeEventListener<TEventName extends keyof T>(evt?: TEventName, fn?: IListener<T, TEventName>): void;
    /**
     * Trigger every registered callbacks for a given event
     * @param {string} evt - The event to trigger
     * @param {*} arg - The eventual payload for that event. All triggered
     * callbacks will recieve this payload as argument.
     */
    trigger<TEventName extends keyof T>(evt: TEventName, arg: IArgs<T, TEventName>): void;
}
/**
 * Simple redefinition of the fromEvent from rxjs to also work on our
 * implementation of EventEmitter with type-checked strings
 * @param {Object} target
 * @param {string} eventName
 * @returns {Observable}
 */
export declare function fromEvent<T, TEventName extends keyof T>(target: IEventEmitter<T>, eventName: TEventName): Observable<IArgs<T, TEventName>>;
export {};

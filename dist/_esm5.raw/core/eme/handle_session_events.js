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
import { concat as observableConcat, defer as observableDefer, EMPTY, merge as observableMerge, of as observableOf, Subject, TimeoutError, } from "rxjs";
import { catchError, concatMap, map, mapTo, mergeMap, takeUntil, timeout, } from "rxjs/operators";
import { events, } from "../../compat";
import { EncryptedMediaError, ErrorTypes, isKnownError, } from "../../errors";
import log from "../../log";
import castToObservable from "../../utils/cast_to_observable";
import retryObsWithBackoff from "../../utils/rx-retry_with_backoff";
import tryCatch from "../../utils/rx-try_catch";
import { KEY_STATUS_ERRORS, } from "./types";
var onKeyError$ = events.onKeyError$, onKeyMessage$ = events.onKeyMessage$, onKeyStatusesChange$ = events.onKeyStatusesChange$;
var KEY_STATUS_EXPIRED = "expired";
/**
 * @param {Error|Object} error
 * @param {Boolean} fatal
 * @returns {Error|Object}
 */
function licenseErrorSelector(error, fatal) {
    if (isKnownError(error)) {
        if (error.type === ErrorTypes.ENCRYPTED_MEDIA_ERROR) {
            error.fatal = fatal;
            return error;
        }
    }
    return new EncryptedMediaError("KEY_LOAD_ERROR", error.toString(), fatal);
}
/**
 * listen to "message" events from session containing a challenge
 * blob and map them to licenses using the getLicense method from
 * selected keySystem.
 * @param {MediaKeySession} session
 * @param {Object} keySystem
 * @returns {Observable}
 */
export default function handleSessionEvents(session, keySystem) {
    log.debug("EME: Handle message events", session);
    var sessionWarningSubject$ = new Subject();
    var getLicenseRetryOptions = {
        totalRetry: 2,
        retryDelay: 200,
        errorSelector: function (error) { return licenseErrorSelector(error, true); },
        onRetry: function (error) {
            return sessionWarningSubject$.next({
                type: "warning",
                value: licenseErrorSelector(error, false),
            });
        },
    };
    var keyErrors = onKeyError$(session)
        .pipe(map(function (error) {
        throw new EncryptedMediaError("KEY_ERROR", error.type, true);
    }));
    var keyStatusesChanges = onKeyStatusesChange$(session)
        .pipe(mergeMap(function (keyStatusesEvent) {
        log.debug("EME: keystatuseschange event", session, keyStatusesEvent);
        // find out possible errors associated with this event
        var warnings = [];
        session.keyStatuses.forEach(function (keyStatus, keyId) {
            // Hack present because the order of the arguments has changed in spec
            // and is not the same between some versions of Edge and Chrome.
            if (keyStatus === KEY_STATUS_EXPIRED || keyId === KEY_STATUS_EXPIRED) {
                var throwOnLicenseExpiration = keySystem.throwOnLicenseExpiration;
                var error = new EncryptedMediaError("KEY_STATUS_CHANGE_ERROR", "A decryption key expired", false);
                if (throwOnLicenseExpiration !== false) {
                    throw error;
                }
                warnings.push({ type: "warning", value: error });
            }
            if (KEY_STATUS_ERRORS[keyId]) {
                throw new EncryptedMediaError("KEY_STATUS_CHANGE_ERROR", "An invalid key status has been encountered: " + keyId, true);
            }
            else if (KEY_STATUS_ERRORS[keyStatus]) {
                throw new EncryptedMediaError("KEY_STATUS_CHANGE_ERROR", "An invalid key status has been encountered: " + keyStatus, true);
            }
        });
        var warnings$ = warnings.length ? observableOf.apply(void 0, warnings) : EMPTY;
        var handledKeyStatusesChange$ = tryCatch(function () {
            return keySystem && keySystem.onKeyStatusesChange ?
                castToObservable(keySystem.onKeyStatusesChange(keyStatusesEvent, session)) : EMPTY;
        }, undefined).pipe() // TS or RxJS Bug?
            .pipe(catchError(function (error) {
            throw new EncryptedMediaError("KEY_STATUS_CHANGE_ERROR", error.toString(), true);
        }), map(function (licenseObject) { return ({
            type: "key-status-change",
            value: { license: licenseObject },
        }); }));
        return observableConcat(warnings$, handledKeyStatusesChange$);
    }));
    var keyMessages$ = onKeyMessage$(session).pipe(mergeMap(function (messageEvent) {
        var message = new Uint8Array(messageEvent.message);
        var messageType = messageEvent.messageType || "license-request";
        log.debug("EME: Event message type " + messageType, session, messageEvent);
        var getLicense$ = observableDefer(function () {
            var getLicense = keySystem.getLicense(message, messageType);
            return castToObservable(getLicense)
                .pipe(timeout(10 * 1000), catchError(function (error) {
                throw error instanceof TimeoutError ?
                    new EncryptedMediaError("KEY_LOAD_TIMEOUT", "The license server took more than 10 seconds to respond.", false) :
                    error;
            }));
        });
        return retryObsWithBackoff(getLicense$, getLicenseRetryOptions)
            .pipe(map(function (license) {
            return {
                type: messageType,
                value: { license: license },
            };
        }));
    }));
    var sessionUpdates = observableMerge(keyMessages$, keyStatusesChanges)
        .pipe(concatMap(function (evt) {
        if (evt.type === "warning") {
            return observableOf(evt);
        }
        var license = evt.value.license;
        if (license == null) {
            log.info("EME: No license given, skipping session.update");
            return EMPTY;
        }
        log.debug("EME: Update session", evt);
        return castToObservable(session.update(license)).pipe(catchError(function (error) {
            throw new EncryptedMediaError("KEY_UPDATE_ERROR", error.toString(), true);
        }), mapTo({
            type: evt.type,
            value: { session: session, license: license },
        }));
    }));
    var sessionEvents = observableMerge(sessionUpdates, keyErrors, sessionWarningSubject$);
    return session.closed ?
        sessionEvents.pipe(takeUntil(castToObservable(session.closed))) :
        sessionEvents;
}

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
import PPromise from "../../../../utils/promise";
import getProbedConfiguration from "../capabilities";
import log from "../log";
import probers from "../probers";
import { ProberStatus, } from "../types";
/**
 * Probe media capabilities, evaluating capabilities with available browsers
 * API.
 *
 * Probe every given features with configuration.
 * If the browser API is not available OR we can't call browser API with enough
 * arguments, do nothing but warn the user (e.g. HDCP is not specified for
 * calling "getStatusForPolicy" API, "mediaCapabilites" API is not available.).
 *
 * From all API results, we return the worst state (e.g. if one API returns a
 * "Not Supported" status among other "Probably" statuses, we return
 * "Not Supported").
 *
 * @param {Object} config
 * @param {Array.<Object>} browserAPIs
 * @returns {Promise}
 */
function probeMediaConfiguration(config, browserAPIS) {
    var globalStatus;
    var resultsFromAPIS = [];
    var promises = [];
    var _loop_1 = function (browserAPI) {
        var probeWithBrowser = probers[browserAPI];
        if (probeWithBrowser) {
            promises.push(probeWithBrowser(config).then(function (_a) {
                var currentStatus = _a[0], result = _a[1];
                resultsFromAPIS.push({ APIName: browserAPI, result: result });
                if (globalStatus == null) {
                    globalStatus = currentStatus;
                }
                else {
                    switch (currentStatus) {
                        // Here, globalStatus can't be null. Hence, if the new current status is
                        // 'worse' than global status, then re-assign the latter.
                        case ProberStatus.NotSupported:
                            // `NotSupported` is either worse or equal.
                            globalStatus = ProberStatus.NotSupported;
                            break;
                        case ProberStatus.Unknown:
                            // `Unknown` is worse than 'Supported' only.
                            if (globalStatus === ProberStatus.Supported) {
                                globalStatus = ProberStatus.Unknown;
                            }
                            break;
                        default:
                            // new status is either `Supported` or unknown status. Global status
                            // shouldn't be changed.
                            break;
                    }
                }
            }).catch(function (err) {
                log.warn(err);
            }));
        }
    };
    for (var _i = 0, browserAPIS_1 = browserAPIS; _i < browserAPIS_1.length; _i++) {
        var browserAPI = browserAPIS_1[_i];
        _loop_1(browserAPI);
    }
    return PPromise.all(promises).then(function () {
        if (globalStatus == null) {
            globalStatus = ProberStatus.Unknown;
        }
        var probedCapabilities = getProbedConfiguration(config, resultsFromAPIS.map(function (a) { return a.APIName; }));
        var areUnprobedCapabilities = JSON.stringify(probedCapabilities).length !== JSON.stringify(config).length;
        if (areUnprobedCapabilities && globalStatus === ProberStatus.Supported) {
            globalStatus = ProberStatus.Unknown;
        }
        if (areUnprobedCapabilities) {
            log.warn("MediaCapabilitiesProber >>> PROBER: Some capabilities " +
                "could not be probed, due to the incompatibility of browser APIs, or the " +
                "lack of arguments to call them.");
        }
        log.info("MediaCapabilitiesProber >>> PROBER: Probed capabilities: ", probedCapabilities);
        return { globalStatus: globalStatus, resultsFromAPIS: resultsFromAPIS };
    });
}
export default probeMediaConfiguration;

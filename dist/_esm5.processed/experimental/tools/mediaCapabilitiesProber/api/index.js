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
import arrayFind from "../../../../utils/array_find";
import PPromise from "../../../../utils/promise";
import log from "../log";
import { ProberStatus, } from "../types";
import probeMediaConfiguration from "./probeMediaConfiguration";
/**
 * Probe configuration and get status from result.
 * @param {Object} config
 * @param {Array.<Object>} browserAPIS
 * @returns {Promise.<string>}
 */
function getStatusFromConfiguration(config, browserAPIS) {
    return probeMediaConfiguration(config, browserAPIS)
        .then(function (_a) {
        var globalStatus = _a.globalStatus;
        switch (globalStatus) {
            case ProberStatus.Unknown:
                return "Unknown";
            case ProberStatus.Supported:
                return "Supported";
        }
        return "NotSupported";
    });
}
/**
 * A set of API to probe media capabilites.
 * Each API allow to evalute a specific feature (HDCP support, decoding infos, etc)
 * and relies on different browser API to probe capabilites.
 */
var mediaCapabilitiesProber = {
    /**
     * Set logger level
     * @param {string} level
     */
    set LogLevel(level) {
        log.setLevel(level);
    },
    /**
     * Get logger level
     * @returns {string}
     */
    get LogLevel() {
        return log.getLevel();
    },
    /**
     * Get HDCP status. Evaluates if current equipement support given
     * HDCP revision.
     * @param {string}
     * @returns {Promise}
     */
    getStatusForHDCP: function (hdcp) {
        if (!hdcp) {
            return PPromise.reject("MediaCapabilitiesProbers >>> Bad Arguments: " +
                "No HDCP Policy specified.");
        }
        var config = {
            hdcp: hdcp,
        };
        var browserAPIS = [
            "isTypeSupportedWithFeatures",
            "getStatusForPolicy",
        ];
        return getStatusFromConfiguration(config, browserAPIS);
    },
    /**
     * Get decoding capabilities from a given video and/or audio
     * configuration.
     * @param {Object} mediaConfig
     * @returns {Promise}
     */
    getDecodingCapabilities: function (mediaConfig) {
        var config = {
            type: mediaConfig.type,
            video: mediaConfig.video,
            audio: mediaConfig.audio,
        };
        var browserAPIS = [
            "isTypeSupported",
            "isTypeSupportedWithFeatures",
            "decodingInfos",
        ];
        return getStatusFromConfiguration(config, browserAPIS);
    },
    /**
     * From an array of given configurations (type  and key system configuration), return
     * supported ones.
     * @param {Array.<Object>} configurations
     * @returns {Promise}
     */
    getCompatibleDRMConfigurations: function (configurations) {
        var promises = [];
        configurations.forEach(function (configuration) {
            var globalConfig = {
                keySystem: configuration,
            };
            var browserAPIS = ["requestMediaKeySystemAccess"];
            promises.push(probeMediaConfiguration(globalConfig, browserAPIS)
                .then(function (_a) {
                var globalStatus = _a.globalStatus, resultsFromAPIS = _a.resultsFromAPIS;
                var requestMediaKeySystemAccessResults = arrayFind(resultsFromAPIS, function (result) { return result.APIName === "requestMediaKeySystemAccess"; });
                return {
                    // As only one API is called, global status is
                    // requestMediaKeySystemAccess status.
                    globalStatus: globalStatus,
                    result: requestMediaKeySystemAccessResults ?
                        requestMediaKeySystemAccessResults.result : undefined,
                };
            })
                .catch(function () {
                return { globalStatus: ProberStatus.NotSupported };
            }));
        });
        return PPromise.all(promises)
            .then(function (supportedConfigs) {
            return supportedConfigs.map(function (_a) {
                var result = _a.result;
                return result;
            });
        });
    },
    /**
     * Get display capabilites. Tells if display can output
     * with specific video and/or audio constrains.
     * @param {Object} displayConfig
     * @returns {Promise}
     */
    getDisplayCapabilities: function (displayConfig) {
        var config = { display: displayConfig };
        var browserAPIS = [
            "matchMedia",
            "isTypeSupportedWithFeatures",
        ];
        return getStatusFromConfiguration(config, browserAPIS);
    },
};
export default mediaCapabilitiesProber;

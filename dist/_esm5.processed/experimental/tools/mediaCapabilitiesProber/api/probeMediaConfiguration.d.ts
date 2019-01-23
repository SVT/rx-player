import { ICapabilitiesTypes } from "../capabilities";
import { IResultsFromAPI } from "../probers";
import { IMediaConfiguration, ProberStatus } from "../types";
export declare type IBrowserAPIS = "isTypeSupported" | "isTypeSupportedWithFeatures" | "matchMedia" | "decodingInfos" | "requestMediaKeySystemAccess" | "getStatusForPolicy";
interface IProbedMediaConfiguration {
    globalStatus: ProberStatus;
    resultsFromAPIS: Array<{
        APIName: ICapabilitiesTypes;
        result?: IResultsFromAPI;
    }>;
}
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
declare function probeMediaConfiguration(config: IMediaConfiguration, browserAPIS: IBrowserAPIS[]): Promise<IProbedMediaConfiguration>;
export default probeMediaConfiguration;

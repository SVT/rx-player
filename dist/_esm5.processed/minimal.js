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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * This file exports a MinimalPlayer class for which features can be lazy-loaded.
 *
 * This allows to import a "minimal" player with a small bundle size and then
 * import only features that is needed.
 */
import Player from "./core/api";
import { addFeatures, } from "./features";
import logger from "./log";
if (false) {
    logger.setLevel("NONE");
}
/**
 * Minimal Player for which you can features at will:
 *   - start with no features
 *   - Allow to only load features wanted
 *
 * @class MinimalPlayer
 */
var MinimalPlayer = /** @class */ (function (_super) {
    __extends(MinimalPlayer, _super);
    function MinimalPlayer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MinimalPlayer.addFeatures = function (featureList) {
        addFeatures(featureList);
    };
    return MinimalPlayer;
}(Player));
export default MinimalPlayer;

import { expect } from "chai";
import sinon from "sinon";
import RxPlayer from "../../../src";
import mockRequests from "../../utils/mock_requests.js";
import sleep from "../../utils/sleep.js";
import launchTestsForContent from "../launch_tests_for_content.js";
import waitForState, {
  waitForLoadedStateAfterLoadVideo,
} from "../../utils/waitForPlayerState";
import {
  manifestInfos,
  URLs
} from "../../contents/DASH_dynamic_SegmentTemplate";

const debugit = function (...args) {
  describe('debug', function() {
    before(function() {
      RxPlayer.LogLevel = "DEBUG";
    });
    after(function() {
      RxPlayer.LogLevel = "NONE";
    });

    it(...args);
  });
};

// describe("DASH dynamic content (SegmentTemplate)", function () {
//   launchTestsForContent(URLs, manifestInfos);
// });

// RxPlayer.LogLevel = "DEBUG";

const TIME_JUST_WHEN_AVAILABLE = 1549292412000;
const TIME_NOW = 1549292427758;

describe("DASH live content (SegmentTemplate)", function () {
  let player;
  let fakeServer;
  let fakeClock;

  beforeEach(() => {
    player = new RxPlayer();
    fakeServer = sinon.fakeServer.create();
    fakeServer.autoRespond = true;
    fakeClock = sinon.useFakeTimers({
      now: TIME_NOW,
      shouldAdvanceTime: true,
    });

    mockRequests(fakeServer, URLs);
  });

  afterEach(() => {
    player.dispose();
    fakeServer.restore();
    fakeClock.restore();
    fakeClock = null;
  });

  it("should fetch and parse the manifest", async function () {
    player.loadVideo({
      url: manifestInfos.url,
      transport: manifestInfos.transport
    });
    expect(fakeServer.requests.length).to.equal(1);

    await sleep(100);

    const manifest = player.getManifest();
    expect(manifest).not.to.equal(null);
    expect(typeof manifest).to.equal("object");
    expect(manifest.getDuration()).to.equal(undefined);
    expect(manifest.transport)
      .to.equal(manifestInfos.transport);
    expect(manifest.availabilityStartTime)
      .to.equal(manifestInfos.availabilityStartTime);
  });

  it("should begin playback on play", async function () {
    player.loadVideo({
      transport: manifestInfos.transport,
      url: manifestInfos.url,
    });

    await sleep(200);

    const manifest = player.getManifest();
    expect(manifest).not.to.equal(null);

    await waitForLoadedStateAfterLoadVideo(player);

    player.play();
    await sleep(200);

    expect(player.getPosition()).to.be.above(0);
    expect(player.getPosition()).to.be.below(0.25);
    expect(player.getVideoLoadedTime()).to.be.above(0);
    expect(player.getVideoPlayedTime()).to.be.above(0);
  });

  it('should stay in loaded state if period is not within initial time', async function () {
    fakeClock.setSystemTime(TIME_JUST_WHEN_AVAILABLE);

    player.loadVideo({
      transport: manifestInfos.transport,
      url: manifestInfos.url,
      startAt: {
        position: 0
      }
    });

    await sleep(200);
    expect(player.getManifest()).not.to.equal(null);

    await waitForState(player, "LOADING");
    await sleep(200);
    expect(player.getPlayerState()).to.equal("LOADING");
  });

  debugit('should start playing when entering first period', async function () {
    /*
     * This time will make initial time to be ~= -0.348,
     * thus forcing the media source loader to wait for
     * 348ms because the first period starts at 0.
     */
    fakeClock.setSystemTime(TIME_JUST_WHEN_AVAILABLE + 9000);

    player.loadVideo({
      transport: manifestInfos.transport,
      url: manifestInfos.url,
      startAt: {
        position: 0
      }
    });

    await waitForLoadedStateAfterLoadVideo(player);

    player.play();
    await sleep(350);

    expect(player.getPosition()).to.be.above(0);
    expect(player.getPosition()).to.be.below(0.25);
    expect(player.getVideoLoadedTime()).to.be.above(0);
    expect(player.getVideoPlayedTime()).to.be.above(0);
  });
});


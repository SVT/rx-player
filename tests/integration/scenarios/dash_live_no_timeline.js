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

// describe("DASH dynamic content (SegmentTemplate)", function () {
//   launchTestsForContent(URLs, manifestInfos);
// });

const NOW = 1548863574000;

describe("DASH live content (SegmentTemplate)", function () {
  let player;
  let fakeServer;
  let fakeClock;

  beforeEach(() => {
    player = new RxPlayer();
    fakeServer = sinon.fakeServer.create();
    fakeServer.autoRespond = true;
    fakeClock = sinon.useFakeTimers({
      now: NOW,
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

    expect(player.getPosition()).to.be.above(1548861753);
    expect(player.getPosition()).to.be.below(1548861755);
    expect(player.getVideoLoadedTime()).to.be.above(0);
    expect(player.getVideoPlayedTime()).to.be.above(0);
  });
});


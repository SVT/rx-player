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

describe("DASH live content (SegmentTemplate)", function () {
  let player;
  let fakeServer;

  beforeEach(() => {
    player = new RxPlayer();
    fakeServer = sinon.createFakeServer();
  });

  afterEach(() => {
    player.dispose();
    fakeServer.restore();
  });

  it("should fetch and parse the manifest", async function () {
    mockRequests(fakeServer, URLs);

    player.loadVideo({
      url: manifestInfos.url,
      transport: manifestInfos.transport,
    });

    expect(fakeServer.requests.length).to.equal(1);
    await sleep(10);
    fakeServer.respond();
    await sleep(10);

    const manifest = player.getManifest();
    expect(manifest).not.to.equal(null);
    expect(typeof manifest).to.equal("object");
    expect(manifest.getDuration()).to.equal(undefined);
    expect(manifest.transport)
      .to.equal(manifestInfos.transport);
  });

  it("should begin playback on play", async function () {
    mockRequests(fakeServer, URLs);
    fakeServer.autoRespond = true;

    player.loadVideo({
      transport: manifestInfos.transport,
      url: manifestInfos.url,
    });
    player.addEventListener("Error", function(err) {
      console.log(`The player crashed: ${err.message}`);
    });

    await waitForLoadedStateAfterLoadVideo(player);

    /*
    console.log('test 3');

    player.play();
    await sleep(200);
    expect(player.getPosition()).to.be.above(0);
    expect(player.getPosition()).to.be.below(0.25);
    expect(player.getVideoLoadedTime()).to.be.above(0);
    expect(player.getVideoPlayedTime()).to.be.above(0);
    */
  });
});


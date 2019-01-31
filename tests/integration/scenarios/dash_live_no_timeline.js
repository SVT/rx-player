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

const NOW = 1548861754000 + 1820000;

describe("DASH live content (SegmentTemplate)", function () {
  let player;
  let fakeServer;
  let fakeClock;

  beforeEach(() => {
    player = new RxPlayer();
    fakeServer = sinon.fakeServer.create();
    fakeServer.autoRespond = true;
    mockRequests(fakeServer, URLs);
  });

  afterEach(() => {
    player.dispose();
    fakeServer.restore();
    if (fakeClock) {
      fakeClock.restore();
      fakeClock = null;
    }
  });

  xit("should fetch and parse the manifest", async function () {
    mockRequests(fakeServer, URLs);

    RxPlayer.LogLevel = 'DEBUG';

    player.loadVideo({
      url: manifestInfos.url,
      transport: manifestInfos.transport
    });

    expect(fakeServer.requests.length).to.equal(1);
    await sleep(100);
    fakeServer.respond();
    await sleep(1000);

    const manifest = player.getManifest();
    expect(manifest).not.to.equal(null);
    expect(typeof manifest).to.equal("object");
    expect(manifest.getDuration()).to.equal(undefined);
    expect(manifest.transport)
      .to.equal(manifestInfos.transport);
  });

  it("should begin playback on play", async function () {
    fakeClock = sinon.useFakeTimers({
      now: NOW,
      shouldAdvanceTime: true,
    });

    this.timeout(5000);
    
    player.loadVideo({
      transport: manifestInfos.transport,
      url: manifestInfos.url,
    });

    player.addEventListener("error", function(err) {
      console.log(`The player crashed: ${err.message}`);
    });

    await sleep(200);

    const manifest = player.getManifest();
    expect(manifest).not.to.equal(null);

    console.log(fakeServer.requests.map((r) => r.response));

    console.log(player.getPlayerState());

    await waitForLoadedStateAfterLoadVideo(player);

    
    await sleep(200);

    console.log(player.getPlayerState());
    console.log(player.getPlayerState());
    console.log(player.getPlayerState());
    console.log(player.getPlayerState());
    console.log(player.getPlayerState());
    console.log(player.getPlayerState());


    console.log(fakeServer.requests.map((r) => r.url));
    console.log(fakeServer.requests.map((r) => r.url));
    console.log(fakeServer.requests.map((r) => r.url));
    console.log(fakeServer.requests.map((r) => r.url));
    console.log(fakeServer.requests.map((r) => r.url));
    console.log(fakeServer.requests.map((r) => r.url));

    /*
    expect(player.getPosition()).to.be.above(0);
    expect(player.getPosition()).to.be.below(0.25);
    expect(player.getVideoLoadedTime()).to.be.above(0);
    expect(player.getVideoPlayedTime()).to.be.above(0);
    */
  });
});


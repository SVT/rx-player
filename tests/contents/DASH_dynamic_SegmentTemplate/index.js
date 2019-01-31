/**
 * Only init data for audio and video for now.
 * One single bitrate, english audio.
 */

const Manifest_URL = {
  url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/Manifest.mpd",
  data: require("raw-loader!./media/Manifest.mpd"),
  contentType: "application/dash+xml",
};

/**
 * URLs for which the request should be stubbed.
 * @type {Array.<Object>}
 */
const URLs = [
  // manifest
  Manifest_URL,

  // Audio initialization segment
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/A48/init.mp4",
    data: require("arraybuffer-loader!./media/A48/init.mp4"),
    contentType: "audio/mp4",
  },

  // Audio segments
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/A48/774430877.m4s",
    data: require("arraybuffer-loader!./media/A48/774430877.m4s"),
    contentType: "audio/mp4",
  },
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/A48/774430878.m4s",
    data: require("arraybuffer-loader!./media/A48/774430878.m4s"),
    contentType: "audio/mp4",
  },
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/A48/774430879.m4s",
    data: require("arraybuffer-loader!./media/A48/774430879.m4s"),
    contentType: "audio/mp4",
  },
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/A48/774430880.m4s",
    data: require("arraybuffer-loader!./media/A48/774430880.m4s"),
    contentType: "audio/mp4",
  },
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/A48/774430881.m4s",
    data: require("arraybuffer-loader!./media/A48/774430881.m4s"),
    contentType: "audio/mp4",
  },
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/A48/774430882.m4s",
    data: require("arraybuffer-loader!./media/A48/774430882.m4s"),
    contentType: "audio/mp4",
  },
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/A48/774430883.m4s",
    data: require("arraybuffer-loader!./media/A48/774430883.m4s"),
    contentType: "audio/mp4",
  },

  // Video initialization segment
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/V300/init.mp4",
    data: require("arraybuffer-loader!./media/V300/init.mp4"),
    contentType: "video/mp4",
  },

  // Video Segments
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/V300/774430877.m4s",
    data: require("arraybuffer-loader!./media/V300/774430877.m4s"),
    contentType: "video/mp4",
  },
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/V300/774430878.m4s",
    data: require("arraybuffer-loader!./media/V300/774430878.m4s"),
    contentType: "video/mp4",
  },
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/V300/774430879.m4s",
    data: require("arraybuffer-loader!./media/V300/774430879.m4s"),
    contentType: "video/mp4",
  },
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/V300/774430880.m4s",
    data: require("arraybuffer-loader!./media/V300/774430880.m4s"),
    contentType: "video/mp4",
  },
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/V300/774430881.m4s",
    data: require("arraybuffer-loader!./media/V300/774430881.m4s"),
    contentType: "video/mp4",
  },
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/V300/774430882.m4s",
    data: require("arraybuffer-loader!./media/V300/774430882.m4s"),
    contentType: "video/mp4",
  },
  {
    url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/V300/774430883.m4s",
    data: require("arraybuffer-loader!./media/V300/774430883.m4s"),
    contentType: "video/mp4",
  },
];

const manifestInfos = {
  url: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/Manifest.mpd",
  transport: "dash",
  isLive: true,
  timeShiftBufferDepth: 300,
  availabilityStartTime: 0,
  periods: [
    {
      adaptations: {
        audio: [
          {
            isAudioDescription: false,
            language: "eng",
            normalizedLanguage: "eng",
            representations: [
              {
                bitrate: 48000,
                codec: "mp4a.40.2",
                mimeType: "audio/mp4",
                index: {
                  init: {
                    mediaURL: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/A48/init.mp4",
                  },
                  segments: [
                    {
                      time: 774430877,
                      timescale: 48000,
                      duration: 288768,
                      mediaURL: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/A48/774430877.mp4",
                    },
                    {
                      time: 774430878,
                      timescale: 48000,
                      duration: 288768,
                      mediaURL: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/A48/774430878.mp4",
                    },
                  ],
                  // ...
                },
              },
            ],
          },
        ],
        video: [
          {
            representations: [
              {
                bitrate: 300000,
                height: 360,
                width: 640,
                codec: "avc1.64001e",
                mimeType: "video/mp4",
                index: {
                  init: {
                    mediaURL: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/V300/init.mp4",
                  },
                  segments: [
                    {
                      time: 774430877,
                      timescale: 90000,
                      duration: 540000,
                      mediaURL: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/V300/774430877.mp4",
                    },
                    {
                      time: 774430878,
                      timescale: 90000,
                      duration: 540000,
                      mediaURL: "http://vm2.dashif.org/livesim/start_1800/testpic_2s/V300/774430878.mp4",
                    },
                  ],
                  // ...
                },
              },
            ],
          },
        ],
      },
    },
  ],
};

export {
  Manifest_URL,
  URLs,
  manifestInfos,
};

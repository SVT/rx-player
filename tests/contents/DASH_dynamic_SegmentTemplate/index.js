/**
 * Only init data for audio and video for now.
 * One single bitrate, english audio.
 */

const Manifest_URL = {
  url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/manifest.mpd",
  data: require("raw-loader!./media/manifest.mpd"),
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
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-init.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-init.mp4"),
    contentType: "audio/mp4",
  },

  // Audio segments
  {
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-1.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-1.mp4"),
    contentType: "audio/mp4",
  },
  {
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-2.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-2.mp4"),
    contentType: "audio/mp4",
  },
  {
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-3.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-3.mp4"),
    contentType: "audio/mp4",
  },
  {
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-4.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-4.mp4"),
    contentType: "audio/mp4",
  },
  {
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-5.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-5.mp4"),
    contentType: "audio/mp4",
  },
  {
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-6.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-6.mp4"),
    contentType: "audio/mp4",
  },
  {
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-7.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-a0/a0-7.mp4"),
    contentType: "audio/mp4",
  },

  // Video initialization segment
  {
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-init.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-init.mp4"),
    contentType: "video/mp4",
  },

  // Video Segments
  {
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-1.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-1.mp4"),
    contentType: "video/mp4",
  },
  {
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-2.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-2.mp4"),
    contentType: "video/mp4",
  },
  {
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-3.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-3.mp4"),
    contentType: "video/mp4",
  },
  {
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-4.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-4.mp4"),
    contentType: "video/mp4",
  },
  {
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-5.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-5.mp4"),
    contentType: "video/mp4",
  },
  {
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-6.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-6.mp4"),
    contentType: "video/mp4",
  },
  {
    url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-7.mp4",
    data: require("arraybuffer-loader!./media/8d69e8c1-a321-4c75-8b39-2a2c08e63e34/dash-v0/v0-7.mp4"),
    contentType: "video/mp4",
  },

  {
    url: "https://time.akamai.com/?iso",
    data: require("raw-loader!./time"),
    contentType: "text"
  }
];

const manifestInfos = {
  url: "https://svt-event-36-b.akamaized.net/world/1391930-035A/manifest.mpd",
  transport: "dash",
};

export {
  Manifest_URL,
  URLs,
  manifestInfos,
};

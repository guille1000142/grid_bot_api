export const config = {
  ipfs: {
    preload: {
      enabled: false,
    },
    relay: { enabled: true },
    hop: { enabled: true, active: true },
    EXPERIMENTAL: { pubsub: true },
    repo: "ok" + Math.random(),
    config: {
      Addresses: {
        Swarm: [
          "/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/",
          "/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star/",
          "/dns4/webrtc-star.discovery.libp2p.io/tcp/443/wss/p2p-webrtc-star/",
        ],
      },
    },
  },
};

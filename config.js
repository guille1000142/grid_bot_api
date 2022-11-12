export const config = {
  ipfs: {
    preload: {
      enabled: false,
    },
    relay: { enabled: true },
    hop: { enabled: true, active: true },
    EXPERIMENTAL: { pubsub: true },
    repo: "./nfts/data",
    config: {
      Addresses: {
        Swarm: [
          "/dns4/gridbotapi-production.up.railway.app/tcp/4002/p2p/Qmdw7Bkmx9GveLcNtReuTAqpZ3qQMdrXFZMKFeivDpbfbL",
          "/dns4/gridbotapi-production.up.railway.app/tcp/4002/p2p/Qmdw7Bkmx9GveLcNtReuTAqpZ3qQMdrXFZMKFeivDpbfbL",
          "/dns4/gridbotapi-production.up.railway.app/tcp/4003/ws/p2p/Qmdw7Bkmx9GveLcNtReuTAqpZ3qQMdrXFZMKFeivDpbfbL",
        ],
      },
    },
  },
};

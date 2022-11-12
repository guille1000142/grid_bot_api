import dotenv from "dotenv";
import express from "express";
import sharp from "sharp";
import formidable from "formidable";
import axios from "axios";
import { create } from "ipfs";
import OrbitDB from "orbit-db";
import cors from "cors";
import { createVerifier } from "fast-jwt";
import Web3 from "web3";
import { config } from "./config.js";

dotenv.config({ silent: process.env.NODE_ENV === "production" });
const app = express();

app.use(cors());

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.QUICKNODE_RPC)
);

function authenticateToken(req, res, next) {
  const wallet = req.query.wallet;
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token === null || token === undefined) return res.sendStatus(401);

  const verify = createVerifier({
    key: async () => process.env.TOKEN_SECRET,
  });
  return verify(token)
    .then((value) => {
      if (wallet === undefined) {
        return next();
      } else {
        const message = "CHAINLINK HACKATHON 2022 | Welcome to grid bot";
        const walletSignature = web3.eth.accounts.recover(
          message,
          value.signature
        );

        if (wallet !== walletSignature.toLocaleLowerCase()) {
          return res.sendStatus(403);
        } else {
          return next();
        }
      }
    })
    .catch((err) => {
      console.log(err);
      return res.sendStatus(403);
    });
}

let docstore;

const createInstance = async () => {
  const ipfsConfig = {
    repo: "./nfts",
    start: false,
    EXPERIMENTAL: {
      pubsub: true,
    },
  };

  try {
    const ipfs = await create(ipfsConfig);
    const orbitdb = await OrbitDB.createInstance(ipfs, {
      offline: true,
      id: "test-local-node",
    });
    docstore = await orbitdb.docstore("nfts");
    docstore.load();
  } catch (err) {
    console.log(err);
  }
};

createInstance();

app.get("/api/v1/nft/create", (req, res) => {
  // REQUEST QUERIES
  const cid = req.query.cid;
  const wallet = [req.query.wallet.toLowerCase()];

  if (!docstore || wallet[0] === null || cid === null)
    return res.status(400).end();

  let likes;

  // CHECK IF DOC EXISTS
  const info = docstore.get(cid);

  if (info.length > 0) {
    const { value, wallets } = info[0].likes;
    // UPDATE CHANGES

    // CHECK IF WALLET HAS GIVEN A LIKE
    const isWallet = wallets.find((user) => user === wallet[0]);
    if (isWallet !== undefined) {
      // REMOVE LIKE
      const index = wallets.indexOf(wallet[0]);
      wallets.splice(index, 1);
      likes = {
        value: value - 1,
        wallets: wallets,
      };
    } else {
      // ADD LIKE
      likes = {
        value: value + 1,
        wallets: wallets.concat(wallet),
      };
      docstore.put({ _id: cid, likes }).then(() => res.status(202).end());
    }
  } else {
    // CREATE DOC
    likes = {
      value: 0,
      wallets: [],
    };
  }

  // UPDATE CHANGES IN DOC
  docstore.put({ _id: cid, likes }).then(() => res.status(202).end());
});

app.get("/api/v1/nft/metadata/:cid", authenticateToken, (req, res) => {
  const cid = req.params.cid;
  axios
    .get(`https://${cid}.ipfs.nftstorage.link/metadata.json`)
    .then((response) => {
      if (docstore) {
        const info = docstore.get(cid);
        if (info.length > 0) {
          res.status(200).json(Object.assign(info[0], response.data));
        } else {
          res.status(200).json(response.data);
        }
      }
    })
    .catch((error) => {
      res.status(400).end();
    });
});

app.post("/api/v1/converter/image", authenticateToken, async (req, res) => {
  const form = formidable();
  form.parse(req, (err, fields, files) => {
    if (err) {
      console.log(err);
      return;
    }

    const { width, height } = JSON.parse(fields.dimensions);
    const imageInput = files.image.filepath;

    sharp(imageInput)
      .resize(width, height)
      .avif()
      .toBuffer()
      .then((data) => {
        const base64Data = data.toString("base64");
        res.status(202).json({
          b64Data: base64Data,
          contentType: "image/avif",
          extension: "avif",
        });
      })
      .catch((err) => {
        console.log(err);
        process.exit(1);
      });
  });
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

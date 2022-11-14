import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import sharp from "sharp";
import formidable from "formidable";
import axios from "axios";
import { create } from "ipfs";
import OrbitDB from "orbit-db";
import cors from "cors";
import { createVerifier } from "fast-jwt";
import Web3 from "web3";

// ENVIROMENTS VARIABLES
dotenv.config({ silent: process.env.NODE_ENV === "production" });

// EXPRESS
const app = express();

// CORS
app.use(cors());

// BODY PARSER
const jsonParser = bodyParser.json();

// WSS QUICKNODE PROVIDER
const web3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.QUICKNODE_RPC)
);

// MIDDLEWARE API
function authenticateToken(req, res, next) {
  // QUERIES
  const wallet = req.query.wallet;

  // HEADERS
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // UNAUTHORIZED
  if (token === null || token === undefined) return res.sendStatus(401);

  // JWT VERIFIER
  const verify = createVerifier({
    key: async () => process.env.TOKEN_SECRET,
  });

  // VERIFY JWT
  return verify(token)
    .then((value) => {
      if (wallet === undefined) {
        return next();
      } else {
        // VERIFY WALLET SIGNATURE
        const message = "CHAINLINK HACKATHON 2022 | Welcome to grid bot";
        const walletSignature = web3.eth.accounts.recover(
          message,
          value.signature
        );

        // VERIFY IF WALLET IS THE OWNER
        if (wallet !== walletSignature.toLocaleLowerCase()) {
          // FORBIDDEN
          return res.sendStatus(403);
        } else {
          // NEXT
          return next();
        }
      }
    })
    .catch((err) => {
      console.log(err);
      // FORBIDDEN
      return res.sendStatus(403);
    });
}

// ORBIT-DB DOCUMENT
let docstore;

const createInstance = async () => {
  // SET IPFS CONFIG
  const ipfsConfig = {
    repo: "./nfts",
    start: false,
    EXPERIMENTAL: {
      pubsub: true,
    },
    // config: {
    //   Addresses: {
    //     Swarm: [
    //       "/dns4/gridbotapi-production.up.railway.app/tcp/4002/p2p/Qmdw7Bkmx9GveLcNtReuTAqpZ3qQMdrXFZMKFeivDpbfbL",
    //       "/dns4/gridbotapi-production.up.railway.app/tcp/4002/p2p/Qmdw7Bkmx9GveLcNtReuTAqpZ3qQMdrXFZMKFeivDpbfbL",
    //       "/dns4/gridbotapi-production.up.railway.app/tcp/4003/ws/p2p/Qmdw7Bkmx9GveLcNtReuTAqpZ3qQMdrXFZMKFeivDpbfbL",
    //     ],
    //   },
    // },
  };

  // SET ORBITDB CONFIG
  const orbitDbConfig = {
    offline: true, // FOR TESTS
    id: "test-local-node", // ID FOR LOCAL TESTS (REQUIRED IN OFFLINE MODE)
  };

  try {
    // CREATE IPFS INSTANCE
    const ipfs = await create(ipfsConfig);

    // CREATE ORBIT-DB INSTANCE
    const orbitdb = await OrbitDB.createInstance(ipfs, orbitDbConfig);

    // CONNECT TO ORBIT-DB JSON DOCUMENT
    docstore = await orbitdb.docstore("nfts");
    docstore.load();
  } catch (err) {
    console.log(err);
  }
};

// CREATE IPFS AND ORBIT-DB INSTANCES
createInstance();

// CREATE OR UPDATE ORBIT-DB DOCUMENT
app.put("/api/v1/nft/create", authenticateToken, jsonParser, (req, res) => {
  // REQUEST BODY

  const wallet = [req.query.wallet];
  const { cid } = req.body;

  if (!docstore || wallet[0] === null || cid === null)
    return res.status(400).end();

  let likes;

  // CHECK IF DOC EXISTS
  const info = docstore.get(cid)[0];

  if (info.length > 0) {
    const { value, wallets } = info.likes;
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
    // NEW DOC
    likes = {
      value: 0,
      wallets: [],
    };
  }

  // CREATE OR UPDATE DOC TO ORBIT-DB
  docstore.put({ _id: cid, likes }).then(() => res.status(202).end());
});

// RETURN NFT METADATA
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

// RESIZE IMAGE TO .AVIF BEFORE UPLOADING IMAGE TO NFT.STORAGE
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

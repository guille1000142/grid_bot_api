import dotenv from "dotenv";
import express from "express";
import sharp from "sharp";
import formidable from "formidable";
import axios from "axios";
import { create } from "ipfs";
import OrbitDB from "orbit-db";
import cors from "cors";

dotenv.config({ silent: process.env.NODE_ENV === "production" });
const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN,
  })
);

let docstore;

const createInstance = async () => {
  try {
    const ipfs = await create({
      repo: "./nfts/data",
      start: true,
      EXPERIMENTAL: {
        pubsub: true,
      },
    });
    const orbitdb = await OrbitDB.createInstance(ipfs);
    docstore = await orbitdb.docstore("nfts");
    docstore.load();
  } catch (err) {
    console.log(err);
  }
};

createInstance();

app.get("/", (req, res) => {
  res.send("<h1>Grid Bot</h1>");
});

app.get("/api/v1/nft/create", async (req, res) => {
  // REQUEST QUERIES
  const cid = req.query.cid;
  const wallet = [req.query.wallet];
  let likes;

  if (docstore) {
    // CHECK IF DOC EXIST
    const info = docstore.get(cid);
    if (info.length > 0) {
      // UPDATE CHANGES
      // CHECK IF WALLET HAS GIVEN A LIKE
      const isWallet = info.wallets.find(({ user }) => user === wallet[0]);
      if (isWallet !== undefined) {
        // REMOVE LIKE
        const index = info.wallets.indexOf(wallet[0]);
        likes = {
          value: info.likes.value - 1,
          wallets: arreglo.splice(index, 1),
        };
      } else {
        // ADD LIKE
        likes = {
          value: info.likes.value + 1,
          wallets: info.wallets.concat(wallet),
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
  }
});

app.get("/api/v1/nft/metadata/:cid", (req, res) => {
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

app.post("/api/v1/image/converter", async (req, res) => {
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
      .catch((err) => console.log(err));
  });
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

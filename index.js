require("dotenv").config();
const express = require("express");
const sharp = require("sharp");
const formidable = require("formidable");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN,
  })
);

app.get("/", (req, res) => {
  res.send("<h1>Grid Bot</h1>");
});

app.get("/api/v1/nfts/:cid", (req, res) => {
  axios
    .get(`https://${req.params.cid}.ipfs.nftstorage.link/metadata.json`)
    .then((response) => res.json(response.data))
    .catch((error) => {
      res.status(400).end();
    });
});

app.post("/api/v1/converter", async (req, res) => {
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

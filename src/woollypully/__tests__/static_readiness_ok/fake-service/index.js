#!/usr/bin/env node

import * as path from "path";
import { fileURLToPath } from "url";

import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.get("/api-discovery", (req, res) => {
  res.send({
    apis: [
      {
        path: "/rest",
        type: "openapi",
        visibility: "public",
      },
    ],
  });
});

app.get("/rest/openapi", (req, res) => {
  res.set("Content-Type", "application/json");
  res.send(["2022-05-23~beta"]);
});

app.get("/rest/openapi/:version", (req, res) => {
  const version = req.params.version;
  if (!version) {
    res.status(400).send("bad request");
    return;
  }
  console.log(version);
  if (!version.match(/^\d\d\d\d-\d\d-\d\d~\w+$/)) {
    res.status(400).send("bad request");
    return;
  }
  // deepcode ignore PT/test: regex validation above
  res.sendFile(path.join(__dirname, "versions", version, "spec.json"));
});

app.listen(8080, () => {
  console.log("server running");
});

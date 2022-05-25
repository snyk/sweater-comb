#!/usr/bin/env node

import * as http from "http";

import { Config } from "./config";
import { Checker } from "./checker";

const config = new Config();
const checker = new Checker(config);

// Check APIs on the proposed service container.
checker
  .checkApis()
  .then(() => {
    // Then run a simple http server
    // that can answer readiness probes.
    http
      .createServer((req, res) => {
        res.writeHead(200);
        res.write("OK");
        res.end();
      })
      .on("error", (err) => console.log(err))
      .listen(config.listenPort, () => {
        console.log("listening for readiness probe");
      });
    console.log("all checks passed");
  })
  .catch((err) => {
    console.log("exit on error", err);
    process.exit(1);
  });

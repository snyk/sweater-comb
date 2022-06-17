#!/usr/bin/env node

import * as http from "http";

import { getConfig } from "./config";
import { Checker } from "./checker";

const main = async (): Promise<number> => {
  const config = await getConfig();
  const checker = new Checker(config);
  await checker.checkApis();
  return config.listenPort;
};

// Configure & check APIs on the proposed service container.
main()
  .then((listenPort: number) => {
    // Then run a simple http server
    // that can answer readiness probes.
    http
      .createServer((req, res) => {
        res.writeHead(200);
        res.write("OK");
        res.end();
      })
      .on("error", (err) => console.log(err))
      .listen(listenPort, () => {
        console.log("listening for readiness probe");
      });
    console.log("all checks passed");
  })
  .catch((err) => {
    console.log("exit on error", err);
    process.exit(1);
  });

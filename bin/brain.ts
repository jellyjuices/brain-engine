#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import { main } from "../src/interface/cli.ts";

main().then(
  (code) => process.exit(code),
  (err: Error) => {
    process.stderr.write(`brain: ${err.message}\n`);
    process.exit(1);
  },
);

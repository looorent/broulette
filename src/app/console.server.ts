import * as repl from "repl";

import { APP_CONFIG, createAppContext } from "@config/server";
import { computeViewportFromCircle } from "@features/coordinate";
import { getPrisma } from "@features/db.server/prisma";
import { findGoogleRestaurantById, searchGoogleRestaurantByText } from "@features/google.server";
import { searchCandidate } from "@features/search-engine.server";

import "dotenv/config";

async function start() {
  try {
    console.log("---");
    console.log("✅ Application context loaded and REPL started.");
    console.log("---");

    const prisma = getPrisma(process.env as any);
    const CONTEXT = createAppContext(process.env); // TODO
    const context = {
      prisma,
      APP_CONFIG,
      CONTEXT,
      findGoogleRestaurantById, // example: findGoogleRestaurantById("ChIJkVjOGDmZwUcRA5MVWISkQfI", CONTEXT.google)
      searchGoogleRestaurantByText, // example: searchGoogleRestaurantByText("Respire", 50.4616929, 4.9234914, CONTEXT.google)
      searchCandidate,
      computeViewportFromCircle, // example: computeViewportFromCircle({ latitude: 50.4616929, longitude: 4.9234914  }, 50)
    };

    const interactive = repl.start({
      prompt: "biteroulette> ",
      eval: async (cmd, _context, _filename, callback) => {
        try {
          const result = await eval(cmd);
          callback(null, result);
        } catch (e) {
          callback(e as Error, undefined);
        }
      }
    });
    Object.assign(interactive.context, context);

  } catch (error) {
    console.error("❌ Failed to start the REPL:", error);
    process.exit(1);
  }
}

start();

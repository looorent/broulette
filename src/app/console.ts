import prisma from "@features/db.server/prisma";
import { findGoogleRestaurantById, searchGoogleRestaurantByText } from "@features/google.server";
import * as repl from "repl";

async function start() {
  try {
    console.log("---");
    console.log("✅ Application context loaded and REPL started.");
    console.log("---");

    const context = {
      prisma: prisma,
      google: {
        findGoogleRestaurantById: findGoogleRestaurantById,
        searchGoogleRestaurantByText: searchGoogleRestaurantByText
      }
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

import { createSyncHandler } from "./handler.ts";
Deno.serve(
  createSyncHandler({
    env: (name) => Deno.env.get(name),
    fetch,
    now: () => new Date(),
  }),
);

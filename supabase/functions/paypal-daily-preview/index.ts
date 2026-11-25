import { createHandler } from "./handler.ts";

// Deployed with platform JWT verification ON. Secrets remain server-side.
Deno.serve(
  createHandler({
    env: (name) => Deno.env.get(name),
    fetch,
    now: () => new Date(),
  }),
);

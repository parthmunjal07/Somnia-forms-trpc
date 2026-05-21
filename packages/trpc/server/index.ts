import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { formsRouter } from "./routes/forms";
import { fieldsRouter } from "./routes/fields";
import { responsesRouter } from "./routes/responses";
import { analyticsRouter } from "./routes/analytics";
import { collaboratorsRouter } from "./routes/collaborators";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  forms: formsRouter,
  fields: fieldsRouter,
  responses: responsesRouter,
  analytics: analyticsRouter,
  collaborators: collaboratorsRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
export * from "../response";

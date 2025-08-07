
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { 
  createUserInputSchema, 
  createDisputeInputSchema, 
  createPartyInputSchema, 
  createHearingInputSchema,
  updateDisputeInputSchema,
  updateHearingInputSchema,
  getDisputeByIdInputSchema,
  getHearingsByDisputeInputSchema,
  getPartiesByDisputeInputSchema
} from './schema';

import { createUser } from './handlers/create_user';
import { createDispute } from './handlers/create_dispute';
import { createParty } from './handlers/create_party';
import { createHearing } from './handlers/create_hearing';
import { getDisputes } from './handlers/get_disputes';
import { getDisputeById } from './handlers/get_dispute_by_id';
import { getHearingsByDispute } from './handlers/get_hearings_by_dispute';
import { getPartiesByDispute } from './handlers/get_parties_by_dispute';
import { updateDispute } from './handlers/update_dispute';
import { updateHearing } from './handlers/update_hearing';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  // Dispute management
  createDispute: publicProcedure
    .input(createDisputeInputSchema)
    .mutation(({ input }) => createDispute(input, 1)), // TODO: Get actual user ID from context
    
  getDisputes: publicProcedure
    .query(() => getDisputes()),
    
  getDisputeById: publicProcedure
    .input(getDisputeByIdInputSchema)
    .query(({ input }) => getDisputeById(input)),
    
  updateDispute: publicProcedure
    .input(updateDisputeInputSchema)
    .mutation(({ input }) => updateDispute(input)),
  
  // Party management
  createParty: publicProcedure
    .input(createPartyInputSchema)
    .mutation(({ input }) => createParty(input)),
    
  getPartiesByDispute: publicProcedure
    .input(getPartiesByDisputeInputSchema)
    .query(({ input }) => getPartiesByDispute(input)),
  
  // Hearing management
  createHearing: publicProcedure
    .input(createHearingInputSchema)
    .mutation(({ input }) => createHearing(input, 1)), // TODO: Get actual user ID from context
    
  getHearingsByDispute: publicProcedure
    .input(getHearingsByDisputeInputSchema)
    .query(({ input }) => getHearingsByDispute(input)),
    
  updateHearing: publicProcedure
    .input(updateHearingInputSchema)
    .mutation(({ input }) => updateHearing(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Information Commission Court System TRPC server listening at port: ${port}`);
}

start();

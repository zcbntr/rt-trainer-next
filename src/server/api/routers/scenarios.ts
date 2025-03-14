import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const scenarioRouter = createTRPCRouter({
  getScenarioById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      // Return the scenario if the id is found and it is set to public.
      // Else check if user is logged in and owns it
      // Else return null

      const scenarioRow = await ctx.db.query.scenarios.findFirst({
        where: (scenarios, { eq }) => eq(scenarios.id, input.id),
        with: {
          waypoints: true,
          airspaces: true,
          airports: true,
          createdBy: true,
        },
      });

      if (!scenarioRow || (scenarioRow.private && !ctx.session?.user)) {
        return null;
      }

      if (
        !scenarioRow.private ||
        ctx.session?.user?.id === scenarioRow.createdBy
      ) {
        return scenarioRow;
      }
    }),

  getOwnedScenarioById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const scenarioRow = await ctx.db.query.scenarios.findFirst({
        where: (scenarios, { eq, and }) =>
          and(
            eq(scenarios.id, input.id),
            eq(scenarios.createdBy, ctx.session.user.id),
          ),
        with: {
          waypoints: true,
          airspaces: true,
          airports: true,
          createdBy: true,
        },
      });

      if (!scenarioRow) {
        return null;
      }

      return scenarioRow;
    }),

  getOwnedScenariosWithWaypoints: protectedProcedure.query(async ({ ctx }) => {
    const scenarios = await ctx.db.query.scenarios.findMany({
      where: (scenarios, { eq }) =>
        eq(scenarios.createdBy, ctx.session.user.id),
      with: {
        waypoints: true,
      },
    });

    return scenarios;
  }),
});

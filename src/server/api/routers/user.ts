import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { auth } from "~/server/auth";

export const userRouter = createTRPCRouter({
  getLoggedInUser: publicProcedure.query(async ({ ctx }) => {
    const session = await auth();

    if (!session || !session?.user) {
      return null;
    }

    const user = await ctx.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, session.user.id),
    });

    return user ?? null;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, input.id),
      });

      return user ?? null;
    }),
});

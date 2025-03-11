import { z } from "zod";

export const scenarioFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Route name must be at least 2 characters.",
    })
    .max(50, {
      message: "Route name must be at most 50 characters.",
    }),
});

export type ScenarioFormSchema = z.infer<typeof scenarioFormSchema>;

"use server";

import {
  scenarioFormSchema,
  type ScenarioFormSchema,
} from "~/app/validation/create-scenario";
import { z } from "zod";
import { db } from "~/server/db";
import {
  airports,
  airspaces,
  scenarios,
  waypoints as waypointsTable,
} from "~/server/db/schema";
import { api } from "~/trpc/server";
import { type Waypoint } from "~/lib/types/waypoint";

export const transformZodErrors = (error: z.ZodError) => {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
};

export async function submitForm(
  formData: ScenarioFormSchema,
  airportIds: string[],
  airspaceIds: string[],
  waypoints: Waypoint[],
) {
  try {
    //validate the FormData
    const validatedFields = scenarioFormSchema.parse(formData);

    console.log({ validatedFields });

    const user = await api.user.getLoggedInUser();

    if (!user) {
      return {
        errors: {
          message: "You must be logged in to create a scenario.",
        },
        data: null,
      };
    }

    await db.transaction(async (tx) => {
      // Create scenario row, then using the id create the waypoints, airportids, and airspaceids in the respective tables
      const scenarioRow = await tx
        .insert(scenarios)
        .values({
          name: validatedFields.name,
          createdBy: user.id,
        })
        .returning({ insertedID: scenarios.id })
        .execute();

      if (!scenarioRow[0]?.insertedID) {
        tx.rollback();
        return;
      }

      const insertedId = scenarioRow[0].insertedID;

      // Create waypoints
      const waypointsRows = await tx
        .insert(waypointsTable)
        .values(
          waypoints.map((waypoint, index) => ({
            scenarioId: insertedId,
            name: waypoint.name,
            lat: waypoint.location[1].toFixed(8),
            lon: waypoint.location[0].toFixed(8),
            alt: 0,
            order: index,
          })),
        )
        .returning({ insertedID: waypointsTable.id })
        .execute();

      // Create airports
      const airportsRows = await tx
        .insert(airports)
        .values(
          airportIds.map((airportId) => ({
            scenarioId: insertedId,
            airportId,
          })),
        )
        .returning({ insertedID: airports.id })
        .execute();

      // Create airspaces
      const airspacesRows = await tx
        .insert(airspaces)
        .values(
          airspaceIds.map((airspaceId) => ({
            scenarioId: insertedId,
            airspaceId,
          })),
        )
        .returning({ insertedID: airspaces.id })
        .execute();

      if (
        waypointsRows.length !== waypoints.length ||
        airportsRows.length !== airportIds.length ||
        airspacesRows.length !== airspaceIds.length
      ) {
        tx.rollback();
        return;
      }
    });

    return {
      errors: null,
      data: "data received and mutated",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        errors: transformZodErrors(error),
        data: null,
      };
    }

    return {
      errors: {
        message: "An unexpected error occurred. Could not create scenario.",
      },
      data: null,
    };
  }
}

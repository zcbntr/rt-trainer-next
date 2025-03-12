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
import { transformZodErrors } from "~/lib/utils";

export async function submitForm(
  formData: ScenarioFormSchema,
  airportIds: string[],
  airspaceIds: string[],
  waypoints: Waypoint[],
) {
  try {
    //validate the FormData
    const validatedFields = scenarioFormSchema.parse(formData);

    // console.log({ validatedFields, airportIds, airspaceIds, waypoints });

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
      const scenarioRows = await tx
        .insert(scenarios)
        .values({
          name: validatedFields.name,
          createdBy: user.id,
        })
        .returning({ insertedID: scenarios.id })
        .execute();

      if (!scenarioRows[0]?.insertedID) {
        tx.rollback();
        return;
      }

      const insertedId = scenarioRows[0].insertedID;

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
            referenceOpenAIPId: waypoint.referenceObjectId,
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
            openAIPId: airportId,
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
            openAIPId: airspaceId,
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

    console.log(error);

    return {
      errors: {
        message: "An unexpected error occurred. Could not create scenario.",
      },
      data: null,
    };
  }
}

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
import { eq } from "drizzle-orm";

export async function submitForm(
  existingScenarioId: number | undefined,
  seed: string,
  formData: ScenarioFormSchema,
  airportIds: string[],
  airspaceIds: string[],
  waypoints: Waypoint[],
  hasEmergencyEvents: boolean,
) {
  try {
    let scenarioId = -1;

    //validate the FormData
    const validatedFields = scenarioFormSchema.parse(formData);

    const user = await api.user.getLoggedInUser();

    if (!user) {
      return {
        errors: {
          message: "You must be logged in to create a scenario.",
        },
        data: null,
      };
    }

    if (!existingScenarioId) {
      await db.transaction(async (tx) => {
        // Create scenario row, then using the id create the waypoints, airportids, and airspaceids in the respective tables
        const scenarioRows = await tx
          .insert(scenarios)
          .values({
            seed: seed,
            name: validatedFields.name,
            hasEmergencyEvents: hasEmergencyEvents,
            createdBy: user.id,
          })
          .returning({ insertedID: scenarios.id })
          .execute();

        if (!scenarioRows[0]?.insertedID) {
          tx.rollback();
          return;
        }

        scenarioId = scenarioRows[0].insertedID;

        // Create waypoints
        const waypointsRows = await tx
          .insert(waypointsTable)
          .values(
            waypoints.map((waypoint, index) => ({
              scenarioId: scenarioId,
              name: waypoint.name,
              lat: waypoint.location[1].toFixed(8),
              lon: waypoint.location[0].toFixed(8),
              alt: 0,
              index: index,
              type: waypoint.type,
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
              scenarioId: scenarioId,
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
              scenarioId: scenarioId,
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
        success: true,
        errors: null,
        data: { scenarioId: scenarioId },
      };
    } else {
      // Update existing route
      const scenario = await api.scenario.getOwnedScenarioById({
        id: existingScenarioId,
      });

      if (!scenario) {
        return {
          errors: {
            message: "Scenario not found.",
          },
          data: null,
        };
      }

      await db.transaction(async (tx) => {
        // Update scenario
        await tx
          .update(scenarios)
          .set({
            name: validatedFields.name,
            seed: seed,
            hasEmergencyEvents: hasEmergencyEvents,
          })
          .where(eq(scenarios.id, existingScenarioId))
          .execute();

        // Update waypoints
        await tx
          .delete(waypointsTable)
          .where(eq(waypointsTable.scenarioId, existingScenarioId))
          .execute();

        await tx
          .insert(waypointsTable)
          .values(
            waypoints.map((waypoint, index) => ({
              scenarioId: existingScenarioId,
              name: waypoint.name,
              lat: waypoint.location[1].toFixed(8),
              lon: waypoint.location[0].toFixed(8),
              alt: 0,
              index: index,
              type: waypoint.type,
              referenceOpenAIPId: waypoint.referenceObjectId,
            })),
          )
          .execute();

        // Update airports
        await tx
          .delete(airports)
          .where(eq(airports.scenarioId, existingScenarioId))
          .execute();

        await tx
          .insert(airports)
          .values(
            airportIds.map((airportId) => ({
              scenarioId: existingScenarioId,
              openAIPId: airportId,
            })),
          )
          .execute();

        // Update airspaces
        await tx
          .delete(airspaces)
          .where(eq(airspaces.scenarioId, existingScenarioId))
          .execute();

        await tx
          .insert(airspaces)
          .values(
            airspaceIds.map((airspaceId) => ({
              scenarioId: existingScenarioId,
              openAIPId: airspaceId,
            })),
          )
          .execute();
      });

      return {
        success: true,
        errors: null,
        data: { scenarioId: existingScenarioId },
      };
    }
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

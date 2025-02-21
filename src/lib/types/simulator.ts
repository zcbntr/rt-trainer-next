"use client";

import { type EmergencyType } from "./scenario";

export type TransponderDialMode =
  | "OFF"
  | "SBY"
  | "GND"
  | "STBY"
  | "ON"
  | "ALT"
  | "TEST";

export type RadioMode = "OFF" | "COM" | "NAV";

export type RadioDialMode = "OFF" | "SBY";

/* The state of the radio. */
export type RadioState = {
  mode: RadioMode;
  dialMode: RadioDialMode;
  activeFrequency: string;
  standbyFrequency: string;
  tertiaryFrequency: string;
};

/* The state of the transponder. */
export type TransponderState = {
  dialMode: TransponderDialMode;
  frequency: string;
  identEnabled: boolean;
  vfrHasExecuted: boolean;
};

/* The state of the altimeter. */
export type AltimeterState = { pressure: number };

/* The details of a aircraft selected by the user. */
export type AircraftDetails = {
  callsign: string;
  prefix: string;
  aircraftType: string;
};

export type SimulatorUpdateData = {
  currentContext: string;
  callsignModified: boolean;
  squark: boolean;
  currentTarget: string | undefined;
  currentTargetFrequency: string | undefined;
  currentTransponderFrequency: string;
  currentPressure: number;
  emergency: EmergencyType;
};

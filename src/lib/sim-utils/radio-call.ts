import * as turf from "@turf/turf";
import { replaceWithPhoneticAlphabet } from "./phonetics";
import {
  addSpacesBetweenCharacters,
  processString,
  removePunctuation,
  trimSpaces,
} from "./string-processors";
import { isCallsignStandardRegistration } from "./callsigns";
import { METORDataSample } from "../types/metor-data";
import { Runway } from "../types/runway";
import { Waypoint } from "../types/waypoint";

export function preproccessRadioCall(message: string): string {
  return processString(message.trim().toLowerCase());
}

export function getCallsignPhonetics(callsign: string): string {
  if (isCallsignStandardRegistration(callsign)) {
    return replaceWithPhoneticAlphabet(callsign.toLowerCase());
  }
  return callsign.toLowerCase(); // For callsigns such as Bombadier 123AB
}

export function getUserCallsignPhoneticsWithPrefix(
  callsign: string,
  prefix: string,
): string {
  if (isCallsignStandardRegistration(callsign)) {
    return `${prefix} ${replaceWithPhoneticAlphabet(callsign.toLowerCase())}`;
  } else {
    return `${prefix} ${callsign.toLowerCase()}`;
  }
}

export function getFrequencyPhonetics(frequency: string): string {
  return replaceWithPhoneticAlphabet(frequency);
}

export function getAircraftTypePhonetics(aircraftType: string): string {
  return replaceWithPhoneticAlphabet(aircraftType.toLowerCase());
}

export function getRadioFrequencyDecimalIndex(words: string[]): number {
  return words.findIndex((x) => x.includes("decimal"));
}

// Eventually implement a way of checking for different spellings of phonetic alphabet words and having r on the end of five and nine, maybe map fiver and niner to five and nine
export function callContainsFrequency(
  radiocall: string,
  frequency: string,
): boolean {
  const radioFrequencyPhonetics = processString(
    replaceWithPhoneticAlphabet(frequency),
  );
  const radioFrequencyPhoneticsNoDecimal = processString(
    radioFrequencyPhonetics.replace("decimal", ""),
  );
  return (
    radiocall
      .replace("five ", "fiver ")
      .replace("nine ", "niner ")
      .includes(radioFrequencyPhonetics) ||
    radiocall
      .replace("five ", "fiver ")
      .replace("nine ", "niner ")
      .includes(radioFrequencyPhoneticsNoDecimal)
  );
}

export function assertCallContainsFrequency(
  radiocall: string,
  frequency: string,
  severity: Severity = Severity.Minor,
): Mistake | undefined {
  if (!callContainsFrequency(radiocall, frequency)) {
    return {
      description: "Your call didn't contain the current radio frequency.",
      severity: severity,
    };
  }
}

export function callContainsWord(radiocall: string, word: string): boolean {
  return radiocall.split(" ").find((x) => x == word.toLowerCase()) != undefined;
}

export function assertCallContainsCriticalWord(
  radiocall: string,
  word: string,
  severity: Severity = Severity.Minor,
): Mistake | undefined {
  if (!callContainsWord(radiocall, word)) {
    return {
      description: "Your call didn't contain the word: \"" + word + '"',
      severity: severity,
    };
  }
}

export function callContainsWords(radiocall: string, words: string[]): boolean {
  for (const word of words) {
    if (radiocall.split(" ").find((x) => x == word.toLowerCase()) == undefined)
      return false;
  }
  return true;
}

export function assertCallContainsWords(
  radiocall: string,
  words: string[],
  severity: Severity,
): Mistake | undefined {
  if (!callContainsWords(radiocall, words)) {
    if (words.length == 1)
      return {
        description: "Your call didn't contain the word: \"" + words[0] + '"',
        severity: severity,
      };
    else
      return {
        description:
          "Your call didn't contain the words: \"" + words.join('", "') + '"',
        severity: severity,
      };
  }
}

export function callStartsWithWord(radiocall: string, word: string): boolean {
  return radiocall.split(" ")[0] == word.toLowerCase();
}

export function callStartsWithConsecutiveWords(
  radiocall: string,
  words: string[],
): boolean {
  const radiocallWords = radiocall.split(" ");
  for (let i = 0; i < words.length; i++) {
    if (radiocallWords[i] != words[i]!.toLowerCase()) return false;
  }
  return true;
}

export function assertCallStartsWithConsecutiveWords(
  radiocall: string,
  words: string[],
  severity: Severity,
): Mistake | undefined {
  if (!callStartsWithConsecutiveWords(radiocall, words)) {
    if (words.length == 1)
      return {
        description:
          "Your call didn't start with the word: \"" + words[0] + '"',
        severity: severity,
      };
    else
      return {
        description:
          "Your call didn't start with the consecutive words: \"" +
          words.join('", "') +
          '"',
        severity: severity,
      };
  }
}

export function callEndsWithWord(radiocall: string, word: string): boolean {
  const callwords = radiocall.split(" ");
  return callwords[callwords.length - 1] == word.toLowerCase();
}

export function callEndsWithConsecutiveWords(
  radiocall: string,
  words: string[],
): boolean {
  const callwords = radiocall.split(" ");
  for (let i = 0; i < words.length; i++) {
    if (
      callwords[callwords.length - i - 1] !=
      words[words.length - i - 1]!.toLowerCase()
    )
      return false;
  }
  return true;
}

export function callContainsConsecutiveWords(
  radiocall: string,
  words: string[],
): boolean {
  return radiocall.includes(words.join(" "));
}

export function assertCallContainsConsecutiveCriticalWords(
  words: string[],
): boolean {
  if (!callContainsConsecutiveWords(words)) {
    if (words.length == 1)
      feedback.pushMistake(
        "Your call didn't contain the word: \"" + words[0] + '"',
        true,
      );
    else
      feedback.pushMistake(
        "Your call didn't contain the consecutive words: \"" +
          words.join('", "') +
          '"',
        true,
      );
    return false;
  }
  return true;
}

export function assertCallContainsConsecutiveNonCriticalWords(
  words: string[],
): boolean {
  if (!callContainsConsecutiveWords(words)) {
    if (words.length == 1)
      feedback.pushMistake(
        "Your call didn't contain the word: \"" + words[0] + '"',
        false,
      );
    else
      feedback.pushMistake(
        "Your call didn't contain the consecutive words: \"" +
          words.join('", "') +
          '"',
        false,
      );
    return false;
  }
  return true;
}

// Issue here is that it needs to check for student g o f l y, and its not doing that
export function callContainsUserCallsign(
  radioCall: string,
  callsign: string,
  prefix?: string,
): boolean {
  const validUserCallsigns = getValidUserCallsigns(callsign, prefix);
  for (let i = 0; i < validUserCallsigns.length; i++) {
    if (
      callContainsConsecutiveWords(radioCall, validUserCallsigns[i]!.split(" "))
    )
      return true;
  }
  return false;
}

export function assertCallContainsUserCallsign(severe: boolean): boolean {
  if (!callContainsUserCallsign()) {
    if (prefix && prefix.trim() != "") {
      feedback.pushMistake("Your call didn't contain your callsign.", severe);
      return false;
    }

    feedback.pushMistake(
      "Your call didn't contain your callsign, including prefix.",
      severe,
    );
    return false;
  }
  return true;
}

export function callStartsWithUserCallsign(): boolean {
  const validUserCallsigns = getValidUserCallsigns();
  for (let i = 0; i < validUserCallsigns.length; i++) {
    if (callStartsWithConsecutiveWords(validUserCallsigns[i].split(" ")))
      return true;
  }
  return false;
}

export function assertCallStartsWithUserCallsign(severe: boolean): boolean {
  if (!callStartsWithUserCallsign()) {
    feedback.pushMistake("Your call didn't start with your callsign.", severe);
    return false;
  }
  return true;
}

export function callEndsWithUserCallsign(): boolean {
  const validUserCallsigns = getValidUserCallsigns();
  for (let i = 0; i < validUserCallsigns.length; i++) {
    if (callEndsWithConsecutiveWords(validUserCallsigns[i].split(" ")))
      return true;
  }
  return false;
}

export function assertCallEndsWithUserCallsign(severe: boolean): boolean {
  if (!callEndsWithUserCallsign()) {
    feedback.pushMistake("Your call didn't end with your callsign.", severe);
    return false;
  }
  return true;
}

export function getTargetCallsignWords(): string[] {
  return currentTarget.split(" ");
}

export function callContainsTargetCallsign(): boolean {
  return callContainsConsecutiveWords(getTargetCallsignWords());
}

/* Returns the callsign of the user as it is to be stated in radio calls from ATC. */
export function getTargetAllocatedCallsign(): string {
  if (userCallsignModified) {
    return (
      getPrefix() +
      " " +
      replaceWithPhoneticAlphabet(
        getAbbreviatedCallsign(seed, getAircraftType(), userCallsign),
      )
    );
  }
  return getUserCallsignPhoneticsWithPrefix();
}

/* Returns the callsign of the user as they would state it in a radio call.
	Given that abbreviated callsigns are optional once established both 
	full and abbreviated versions returned if abbreviation established. */
export function getValidUserCallsigns(
  callsign: string,
  prefix?: string,
  aircraftType?: string,
): string[] {
  const callsigns = [
    trimSpaces(
      prefix + " " + addSpacesBetweenCharacters(removePunctuation(callsign)),
    ).toLowerCase(), // Student G O F L Y
    getUserCallsignPhoneticsWithPrefix().toLowerCase(), // Student Golf Oscar Foxtrot Lima Yankee
  ];

  if (userCallsignModified) {
    callsigns.push(getTargetAllocatedCallsign());
    callsigns.push(
      prefix +
        " " +
        trimSpaces(
          addSpacesBetweenCharacters(
            removePunctuation(
              getAbbreviatedCallsign(seed, aircraftType, callsign),
            ),
          ),
        ),
    );
  }

  return callsigns;
}

export function getAirportMETORSample(): METORDataSample {
  return getStartAirport().getMETORSample(seed);
}

export function getEndAirportMETORSample(): METORDataSample {
  return getEndAirport().getMETORSample(seed);
}

export function getTakeoffRunway(): Runway {
  return getStartAirport().getTakeoffRunway(seed);
}

export function getTakeoffRunwayName(): string {
  return getStartAirport().getTakeoffRunway(seed).designator;
}

export function getLandingRunway(): Runway {
  return getEndAirport().getLandingRunway(seed);
}

export function getLandingRunwayName(): string {
  return getEndAirport().getLandingRunway(seed).designator;
}

export function getStartAirportStartingPoint(): string {
  return "hangers";
}

export function getTakeoffRunwayTaxiwayHoldingPoint(): string {
  return "alpha";
}

export function assertCallContainsTakeOffRunwayName(severe: boolean): boolean {
  if (!callContainsConsecutiveWords([getTakeoffRunway().designator])) {
    feedback.pushMistake(
      "Your call didn't contain the name of the runway you are taking off from.",
      severe,
    );
    return false;
  }
  return true;
}

export function assertCallContainsAircraftType(severe: boolean): boolean {
  if (!callContainsConsecutiveWords([getAircraftType()])) {
    feedback.pushMistake(
      "Your call didn't contain the type of aircraft you are flying: " +
        getAircraftType(),
      severe,
    );
    return false;
  }
  return true;
}

export function assertCallContainsScenarioStartPoint(severe: boolean): boolean {
  if (!callContainsConsecutiveWords([getStartAirportStartingPoint()])) {
    feedback.pushMistake(
      "Your call didn't contain the location you started your engine at.",
      severe,
    );

    return false;
  }
  return true;
}

export function assertCallContainsStartAirportName(severe: boolean): boolean {
  if (!callContainsConsecutiveWords([getStartAirport().getShortName()])) {
    feedback.pushMistake(
      "Your call didn't contain the name of your start airport.",
      severe,
    );
    return false;
  }
  return true;
}

export function assertCallContainsEndAirportName(severe: boolean): boolean {
  if (
    !callContainsConsecutiveWords([
      getEndAirport().getShortName().toLowerCase(),
    ])
  ) {
    feedback.pushMistake(
      "Your call didn't contain the name of the ending aerodrome.",
      severe,
    );
    return false;
  }
  return true;
}

export function getSquarkCode(): number {
  return 2434 + (seed % 5) - 2;
}

export function assertCallContainsSqwarkCode(severe: boolean): boolean {
  if (!callContainsWord(currentTransponderFrequency.toString())) {
    feedback.pushMistake("Your call didn't contain the squawk code.", severe);
    return false;
  }
  return true;
}

export function assertCallContainsWilco(severe: boolean): boolean {
  if (!callContainsWord("wilco")) {
    feedback.pushMistake(
      'Your call didn\'t contain "wilco" or "will comply".',
      severe,
    );
    return false;
  }
  return true;
}

export function assertCallContainsRoger(severe: boolean): boolean {
  if (!callContainsWord("roger")) {
    feedback.pushMistake(
      'Your call didn\'t contain "roger" (message received).',
      severe,
    );
    return false;
  }
  return true;
}

export function assertCallContainsAltitude(severe: boolean): boolean {
  if (
    !callContainsWord("altitude") &&
    !callContainsWord(getCurrentScenarioPoint().pose.altitude.toString())
  ) {
    feedback.pushMistake("Your call didn't contain your altitude.", severe);
    return false;
  }
  return true;
}

export function assertCallContainsTakeOffRunwayHoldingPoint(
  severe: boolean,
): boolean {
  if (!callContainsWord(getTakeoffRunwayTaxiwayHoldingPoint())) {
    feedback.pushMistake(
      "Your call didn't contain your holding point.",
      severe,
    );
    return false;
  }
  return true;
}

export function assertCallContainsTakeoffPressure(severe: boolean): boolean {
  const pressureSample = getStartAirportMETORSample()
    .getPressureString()
    .split(" ");
  if (!callContainsWord(pressureSample[0])) {
    feedback.pushMistake("Your call didn't contain the air pressure.", severe);
    return false;
  } else if (
    pressureSample.length > 1 &&
    !callContainsWord(pressureSample[1])
  ) {
    feedback.pushMistake(
      'Your air pressure call didn\'t include "millibars" when the pressure was below 1000 millibars. \n' +
        "Numbers must have units when confusion is possible.",
      false,
    );
    return true;
  }
  return true;
}

export function assertCallContainsTakeoffTemperature(severe: boolean): boolean {
  let temperatureSample = getStartAirportMETORSample().getTemperatureString();
  let sign = "";

  if (temperatureSample[0] == "-" || temperatureSample[0] == "+") {
    temperatureSample = temperatureSample.substring(1);
    sign = temperatureSample[0];
  }

  if (!callContainsWord(temperatureSample)) {
    feedback.pushMistake("Your call didn't contain the temperature.", severe);
    return false;
  } else if (!callContainsWord(sign + temperatureSample)) {
    feedback.pushMistake(
      "Your temperature readback didn't include the sign " +
        sign +
        ". \n" +
        "Temperatures must have a sign when confusion is possible.",
      false,
    );

    return true;
  }
  return true;
}

export function assertCallContainsTakeoffDewpoint(severe: boolean): boolean {
  let dewpointSample = getStartAirportMETORSample().getDewpointString();
  let sign = "";

  if (dewpointSample[0] == "-" || dewpointSample[0] == "+") {
    dewpointSample = dewpointSample.substring(1);
    sign = dewpointSample[0];
  }

  if (!callContainsWord(dewpointSample)) {
    feedback.pushMistake("Your call didn't contain the dewpoint.", severe);
    return false;
  } else if (!callContainsWord(sign + dewpointSample)) {
    feedback.pushMistake(
      "Your dewpoint readback didn't include the sign " +
        sign +
        ". \n" +
        "Dewpoints must have a sign when confusion is possible.",
      false,
    );

    return true;
  }
  return true;
}

export function assertCallContainsTakeoffWindSpeed(severe: boolean): boolean {
  // Wind speed followed by 'knots'
  const windSpeedSample = getStartAirportMETORSample()
    .getWindSpeedString()
    .split(" ");
  if (!callContainsWord(windSpeedSample[0])) {
    feedback.pushMistake("Your call didn't contain the wind speed.", severe);
    return false;
  } else if (!callContainsWord(windSpeedSample[1])) {
    feedback.pushMistake(
      "Your call didn't contain the wind speed units.",
      false,
    );
    return true;
  }
  return true;
}

export function assertCallContainsTakeoffWindDirection(
  severe: boolean,
): boolean {
  const windDirectionSample = getStartAirportMETORSample()
    .getWindDirectionString()
    .split(" ");
  if (!callContainsConsecutiveWords(windDirectionSample)) {
    feedback.pushMistake(
      "Your call didn't contain the wind direction.",
      severe,
    );
    return false;
  }
  return true;
}

// Doesnt check for the specific flight rules of the scenario - but at time of writing scenario only supports VFR
export function assertCallContainsFlightRules(severe: boolean): boolean {
  if (!(callContainsWord("vfr") || callContainsWord("visual"))) {
    feedback.pushMistake(
      "Your call didn't contain your flight rules (VFR).",
      severe,
    );
    return false;
  }
  return true;
}

export function getTakeoffTurnoutHeading(): number {
  const headingToFirstWaypoint = turf.distance(
    scenario.waypoints[0].location,
    scenario.waypoints[1].location,
  );

  // If turnout heading doesnt exist then most likely something has gone very wrong as
  // there should have already been an error, issue will be with getHeadingTo method
  if (headingToFirstWaypoint == undefined)
    throw new Error("No heading in getTakeoffTurnoutHeading.");

  return headingToFirstWaypoint;
}

export function assertCallContainsTakeoffTurnoutHeading(
  severe: boolean,
): boolean {
  if (!callContainsWord(getTakeoffTurnoutHeading().toString())) {
    feedback.pushMistake(
      "Your call didn't contain your takeoff turnout heading.",
      severe,
    );
    return false;
  }
  return true;
}

export function getTakeoffTransitionAltitude(): number {
  return getStartAirport().getTakeoffTransitionAltitude();
}

export function assertCallContainsTransitionAltitude(severe: boolean): boolean {
  if (!callContainsWord(getTakeoffTransitionAltitude().toString())) {
    feedback.pushMistake(
      "Your call didn't contain the takeoff transition altitude.",
      severe,
    );
    return false;
  }
  return true;
}

export function getTakeoffTraffic(): string {
  if (seed % 2 == 0) return "traffic is Cessna 152 reported final";
  else return "no reported traffic";
}

export function getLandingTraffic(): string {
  if (getEndAirport().isControlled()) {
    if (seed % 5 == 0) return "Vehicle crossing";
    else return "";
  } else {
    if (seed % 3 == 0) return "traffic is a PA 28 lined up to depart";
    else return "no reported traffic";
  }
}

export function getTakeoffWindString(): string {
  return getStartAirportMETORSample().getWindString();
}

export function getCurrentAltitude(): number {
  return getCurrentScenarioPoint().pose.altitude;
}

export function getCurrentAltitudeString(): string {
  return getCurrentAltitude() + " feet";
}

export function assertCallContainsCurrentAltitude(severe: boolean): boolean {
  if (!callContainsWord(getCurrentAltitude().toString())) {
    feedback.pushMistake(
      "Your call didn't contain your current altitude.",
      severe,
    );
    return false;
  }
  return true;
}

export function assertCallContainsLandingRunwayName(severe: boolean): boolean {
  if (!callContainsConsecutiveWords([getLandingRunway().designator])) {
    feedback.pushMistake(
      "Your call didn't contain the name of the runway you are landing on.",
      severe,
    );
    return false;
  }
  return true;
}

export function assertCallContainsLandingPressure(severe: boolean): boolean {
  const pressureSample = getEndAirportMETORSample()
    .getPressureString()
    .split(" ");
  if (!callContainsWord(pressureSample[0])) {
    feedback.pushMistake("Your call didn't contain the air pressure.", severe);
    return false;
  } else if (
    pressureSample.length > 1 &&
    !callContainsWord(pressureSample[1])
  ) {
    feedback.pushMistake(
      'Your air pressure call didn\'t include "millibars" when the pressure was below 1000 millibars. \n' +
        "Numbers must have units when confusion is possible.",
      false,
    );
    return true;
  }
  return true;
}

export function getPreviousWaypoint(): Waypoint {
  return scenario.waypoints[getCurrentScenarioPoint().nextWaypointIndex];
}

export function getPreviousWaypointName(): string {
  return getPreviousWaypoint().name;
}

export function assertCallContainsPreviousWaypointName(
  severe: boolean,
): boolean {
  if (!callContainsConsecutiveWords([getPreviousWaypointName()])) {
    feedback.pushMistake(
      "Your call didn't contain the name of the previous waypoint.",
      severe,
    );
    return false;
  }
  return true;
}

export function getDistanceToPreviousWaypointInMeters(): number {
  return turf.distance(
    getPreviousWaypoint().location,
    getCurrentScenarioPoint().pose.position,
  );
}

export function getDistanceToPreviousWaypointInNauticalMiles(): number {
  return getDistanceToPreviousWaypointInMeters() / 1852;
}

export function getPositionRelativeToLastWaypoint(): string {
  const heading = turf.bearing(
    getPreviousWaypoint().location,
    getCurrentScenarioPoint().pose.position,
  );
  const compassDirection = getCompassDirectionFromHeading(heading);
  const distance = getDistanceToPreviousWaypointInNauticalMiles();
  return Math.ceil(distance) + " miles " + compassDirection;
}

export function assertCallContainsPositionRelativeToLastWaypoint(
  severe: boolean,
): boolean {
  if (
    !callContainsConsecutiveWords(
      getPositionRelativeToLastWaypoint().split(" "),
    )
  ) {
    feedback.pushMistake(
      "Your call didn't contain your position relative to the previous waypoint.",
      severe,
    );
    return false;
  }
  return true;
}

export function getLandingParkingSpot(): string {
  return "hangers";
}

export function assertCallContainsLandingParkingSpot(severe: boolean): boolean {
  if (!callContainsConsecutiveWords([getLandingParkingSpot()])) {
    feedback.pushMistake("Your call didn't contain your parking spot.", severe);
    return false;
  }
  return true;
}

export function getOverheadJoinAltitude(): number {
  return 2000;
}

export function assertCallContainsOverheadJoinAltitude(
  severe: boolean,
): boolean {
  if (!callContainsWord(getOverheadJoinAltitude().toString())) {
    feedback.pushMistake(
      "Your call didn't contain the overhead join altitude.",
      severe,
    );
    return false;
  }
  return true;
}

export function getClosestVRP(): Waypoint {
  throw new Error("Unimplemented function");
}

export function getClosestVRPName(): string {
  throw new Error("Unimplemented function");
}

export function assertCallContainsClosestVRPName(severe: boolean): boolean {
  if (!callContainsConsecutiveWords([getClosestVRPName()])) {
    feedback.pushMistake("Your call didn't contain the closest VRP.", severe);
    return false;
  }
  return true;
}

export function getNextWaypoint(): Waypoint {
  return scenario.waypoints[getCurrentScenarioPoint().nextWaypointIndex];
}

export function getNextWaypointName(): string {
  return getNextWaypoint().name;
}

export function getNextWaypointDistance(): number {
  return turf.distance(
    getNextWaypoint().location,
    getCurrentScenarioPoint().pose.position,
  );
}

export function getNextWaypointDistanceNearestMile(): number {
  // round to nearest mile
  return Math.round(getNextWaypointDistance() / 1609.344);
}

export function assertCallContainsNextWaypointName(severe: boolean): boolean {
  if (!callContainsConsecutiveWords([getNextWaypointName()])) {
    feedback.pushMistake(
      "Your call didn't contain the name of the next waypoint.",
      severe,
    );
    return false;
  }
  return true;
}

export function assertCallContainsNextWaypointDistance(
  severe: boolean,
): boolean {
  if (!callContainsWord(getNextWaypointDistanceNearestMile().toString())) {
    feedback.pushMistake(
      "Your call didn't contain the distance to the next waypoint.",
      severe,
    );
    return false;
  }
  return true;
}

export function getCurrentTime(): number {
  return getCurrentScenarioPoint().timeAtPoint;
}

export function assertCallContainsCurrentTime(severe: boolean): boolean {
  if (!callContainsWord(getCurrentTime().toString())) {
    feedback.pushMistake("Your call didn't contain the current time.", severe);
    return false;
  }
  return true;
}

export function getNextWaypointArrivalTime(): number {
  throw scenario.scenarioPoints.find(
    (point) =>
      point.nextWaypointIndex == getCurrentScenarioPoint().nextWaypointIndex,
  )?.timeAtPoint;
}

export function assertCallContainsNextWaypointArrivalTime(
  severe: boolean,
): boolean {
  if (
    !callContainsWord(convertMinutesToTimeString(getNextWaypointArrivalTime()))
  ) {
    feedback.pushMistake(
      "Your call didn't contain the arrival time at the next waypoint.",
      severe,
    );
    return false;
  }
  return true;
}

export function getCurrentATISLetter(): string {
  if (getEndAirport().isControlled()) {
    return getEndAirport().getATISLetter(seed);
  } else {
    throw new Error("No ATIS letter for uncontrolled aerodrome.");
  }
}

export function assertCallContainsCurrentATISLetter(severe: boolean): boolean {
  if (!callContainsWord(getCurrentATISLetter())) {
    feedback.pushMistake(
      "Your call didn't contain the current ATIS letter.",
      severe,
    );
    return false;
  }
  return true;
}

export function getCurrentFixName(): string {
  throw new Error("Unimplemented method");
}

export function assertCallContainsCurrentFixName(severe: boolean): boolean {
  if (!callContainsConsecutiveWords([getCurrentFixName()])) {
    feedback.pushMistake(
      "Your call didn't contain the current fix name.",
      severe,
    );
    return false;
  }
  return true;
}

export function getNextFixName(): string {
  throw new Error("Unimplemented method");
}

export function assertCallContainsNextFixName(severe: boolean): boolean {
  if (!callContainsConsecutiveWords([getNextFixName()])) {
    feedback.pushMistake("Your call didn't contain the next fix name.", severe);
    return false;
  }
  return true;
}

export function getNextFrequency(): string | undefined {
  return scenario.scenarioPoints.find(
    (x) => x.updateData.currentTargetFrequency != currentTargetFrequency,
  )?.updateData.currentTargetFrequency;
}

export function assertCallContainsNextFrequency(severe: boolean): boolean {
  if (getNextFrequency() == undefined) {
    throw new Error("No next frequency found.");
  }

  if (!callContainsWord(getNextFrequency() as string)) {
    feedback.pushMistake(
      "Your call didn't contain the next frequency.",
      severe,
    );
    return false;
  }
  return true;
}

export function getNextFrequencyName(): string | undefined {
  return scenario.scenarioPoints.find(
    (x) => x.updateData.currentTargetFrequency != currentTargetFrequency,
  )?.updateData.currentTarget;
}

export function assertCallContainsNextFrequencyName(severe: boolean): boolean {
  if (getNextFrequencyName() == undefined) {
    throw new Error("No next frequency found.");
  }

  if (!callContainsConsecutiveWords([getNextFrequencyName() as string])) {
    feedback.pushMistake(
      "Your call didn't contain the next frequency name.",
      severe,
    );
    return false;
  }
  return true;
}

export function getPositionRelativeToNearestFix(): string {
  throw new Error("Unimplemented method");
}

export function assertCallContainsPositionRelativeToNearestFix(
  severe: boolean,
): boolean {
  if (
    !callContainsConsecutiveWords(getPositionRelativeToNearestFix().split(" "))
  ) {
    feedback.pushMistake(
      "Your call didn't contain your position relative to the nearest fix.",
      severe,
    );
    return false;
  }
  return true;
}

export function getCurrentAltimeterSetting(): string {
  throw new Error("Unimplemented method");
}

export function assertCallContainsCurrentAltimeterSetting(
  severe: boolean,
): boolean {
  if (!callContainsWord(getCurrentAltimeterSetting())) {
    feedback.pushMistake(
      "Your call didn't contain the current altimeter setting.",
      severe,
    );
    return false;
  }
  return true;
}

// Needs implementing properly
export function getMATZPenetrationHeight(): string {
  return "1500 feet";
}

export function assertCallContainsMATZPenetrationHeight(
  severe: boolean,
): boolean {
  if (!callContainsWords(getMATZPenetrationHeight().split(" "))) {
    feedback.pushMistake(
      "Your call didn't contain the correct height for transiting the MATZ.",
      severe,
    );
    return false;
  }
  return true;
}

export function getATCPressureReadingFromSeed(seed: number): string {
  return (1015 - (seed % 30)).toString();
}

export function assertCallContainsATCPressureReading(
  severe: boolean,
  seed: number,
): boolean {
  if (!callContainsWord(getATCPressureReadingFromSeed(seed))) {
    feedback.pushMistake(
      "Your call didn't contain the pressure reading.",
      severe,
    );
    return false;
  }
  return true;
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import { isCallsignStandardRegistration } from "~/lib/sim-utils/callsigns";
import { replaceWithPhoneticAlphabet } from "~/lib/sim-utils/phonetics";
import { type Airport } from "~/lib/types/airport";
import { type Airspace } from "~/lib/types/airspace";
import {
  type RadioCall,
  type RadioMessageAttempt,
} from "~/lib/types/radio-call";
import radiocalls from "~/lib/radio-calls/radio-calls.json";
import Altimeter from "./altimeter";
import Transponder from "./transponder";
import MessageOutputBox from "./message-output-box";
import MessageInputBox from "./message-input-box";
import useRadioStore from "~/app/stores/radio-store";
import useTransponderStore from "~/app/stores/transponder-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { toast } from "sonner";
import Radio from "./radio";
import SimulatorMap from "../maps/simulator";
import { useEffect, useMemo } from "react";
import useAltimeterStore from "~/app/stores/altimeter-store";
import useAeronauticalDataStore from "~/app/stores/aeronautical-data-store";
import { Button, buttonVariants } from "~/components/ui/button";
import Link from "next/link";
import useScenarioStore from "~/app/stores/scenario-store";
import { callContainsUserCallsign } from "~/lib/sim-utils/radio-call";
import useAircraftDataStore from "~/app/stores/aircraft-data-store";
import RadioCallValidator, {
  ValidationResult,
} from "~/lib/radio-calls/validator";

type SimulatorProps = {
  className?: string;
};

const Simulator = ({ className }: SimulatorProps) => {
  // Simulator state and settings
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const scenarioPoints = useScenarioStore((state) => state.scenarioPoints);
  const scenarioPointIndex = useScenarioStore(
    (state) => state.scenarioPointIndex,
  );
  const setScenarioPointIndex = useScenarioStore(
    (state) => state.setScenarioPointIndex,
  );
  const currentRadioCall = useScenarioStore((state) => state.currentRadioCall);
  const setMostRecentlyRecievedATCRadioCall = useScenarioStore(
    (state) => state.setMostRecentlyRecievedATCRadioCall,
  );
  const pushRadioCallToHistory = useScenarioStore(
    (state) => state.pushRadioCallToHistory,
  );
  const endPointIndex = useScenarioStore(
    (state) => state.scenarioEndPointIndex,
  );

  if (scenarioPoints.length === 0) {
    throw new Error("No scenario points loaded");
  }

  const radioDialMode = useRadioStore((state) => state.dialMode);
  const radioActiveFrequency = useRadioStore((state) => state.activeFrequency);

  const transponderDialMode = useTransponderStore((state) => state.dialMode);
  const transponderFrequency = useTransponderStore((state) => state.frequency);

  const altimeterPressure = useAltimeterStore((state) => state.shownPressure);

  const callsign = useAircraftDataStore((state) => state.callsign);
  const aircraftType = useAircraftDataStore((state) => state.type);
  const prefix = useAircraftDataStore((state) => state.prefix);

  const validator = new RadioCallValidator("radio-calls.json");

  const atcMessage = "";
  let userMessage = "";
  let currentTarget: string;
  let currentTargetFrequency: string;
  const currentRoutePointIndex = 0;
  let failedAttempts = 0;
  let currentSimContext: string;

  // Page settings
  const speechRecognitionSupported = false; // Speech recognition is not supported in all browsers e.g. firefox - can be resolved with a polyfill
  const speechNoiseLevel = 0;
  const readRecievedCalls = false;
  const liveFeedback = false;
  let endOfRouteDialogOpen = false;
  let repeatMistakeDialogOpen = false;

  // Load stores if not populated
  const airspaces: Airspace[] = [];

  const onRouteAirspaces: Airspace[] = [];

  const airports: Airport[] = [];

  const onRouteAirports: Airport[] = [];

  useEffect(() => {
    async function fetchAirspaces() {
      // Lazy load airspaces/airports into stores - can trpc not do this typesafe?
      const freshAirspaces: Airspace[] = (
        await fetch("/api/aeronautical-data/airspaces").then((res) =>
          res.json(),
        )
      ).data as Airspace[];

      useAeronauticalDataStore.setState({ airspaces: freshAirspaces });
    }

    async function fetchAirports() {
      const freshAirports: Airport[] = (
        await fetch("/api/aeronautical-data/airports").then((res) => res.json())
      ).data as Airport[];

      useAeronauticalDataStore.setState({ airports: freshAirports });
    }

    if (airports.length === 0) {
      void fetchAirports();
    }

    if (airspaces.length === 0) {
      void fetchAirspaces();
    }
  }, [airports.length, airspaces.length]);

  useMemo(() => {
    /**
     * Reads out the current atc message using the speech synthesis API, with added static noise
     *
     * @remarks
     * If the speech synthesis API is not supported in the current browser, then an error is logged to the console.
     *
     * @returns void
     */
    function TTSWithNoise(noiseLevel: number): void {
      if ("speechSynthesis" in window) {
        // Get the speech synthesis API and audio context
        const synth = window.speechSynthesis;
        const audioContext = new AudioContext();

        // Create speech synthesis utterance and noise buffer
        const speech = new SpeechSynthesisUtterance(atcMessage);
        const noiseBuffer = generateStaticNoise(45, speech.rate * 44100);
        const noiseSource = new AudioBufferSourceNode(audioContext, {
          buffer: noiseBuffer,
        });
        const gainNode = new GainNode(audioContext);
        synth.speak(speech);

        // Adjust the gain based on the noise level
        gainNode.gain.value = noiseLevel;

        // Connect nodes
        noiseSource.connect(gainNode).connect(audioContext.destination);
        noiseSource.start();

        // Stop the noise after the speech has finished
        speech.onend = () => {
          noiseSource.stop();
        };
      } else {
        console.error("SpeechSynthesis API is not supported in this browser.");
      }
    }

    if (readRecievedCalls && atcMessage) {
      TTSWithNoise(speechNoiseLevel);
    }
  }, [readRecievedCalls, atcMessage, speechNoiseLevel]);

  //   $: tutorialStep2 =
  //     transponderState?.dialMode == "SBY" && radioState?.dialMode == "SBY";
  //   $: tutorialStep3 =
  //     radioState?.activeFrequency ==
  //     scenario?.getCurrentPoint().updateData.currentTargetFrequency;

  /**
   * Generates static noise for the speech synthesis API in the form of an AudioBuffer
   * @param duration - The duration of the noise in seconds
   * @param sampleRate - The sample rate of the noise
   *
   * @returns AudioBuffer
   */
  function generateStaticNoise(duration: number, sampleRate: number) {
    const bufferSize = sampleRate * duration;
    const buffer = new AudioBuffer({
      length: bufferSize,
      numberOfChannels: 1,
      sampleRate,
    });
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  /**
   * Checks the client state (radio frequency, transponder frequency, ...) matches the server state
   *
   * @remarks
   * This function checks the client state against the server state to ensure the client is in the correct state to make a radio call.
   *
   * @returns boolean
   */
  function checkClientSimStateCorrect(): boolean {
    if (radioDialMode == "OFF") {
      toast.message("Error", { description: "Radio is off" });
      return false;
    } else if (transponderDialMode == "OFF") {
      toast.message("Error", { description: "Transponder is off" });
      return false;
    } else if (
      radioActiveFrequency !=
      scenarioPoints[scenarioPointIndex]?.currentTargetFrequency.value
    ) {
      toast.message("Error", { description: "Radio frequency incorrect" });
      return false;
    } else if (
      transponderFrequency !=
      scenarioPoints[scenarioPointIndex]?.currentTransponderFrequency
    ) {
      toast.message("Error", {
        description: "Transponder frequency incorrect",
      });
      return false;
    } else if (
      altimeterPressure != scenarioPoints[scenarioPointIndex]?.currentPressure
    ) {
      toast.message("Error", {
        description: "Altimeter pressure setting incorrect",
      });
      return false;
    }

    return true;
  }

  /**
   * Handles the feedback from the parser
   *
   * @remarks
   * This function handles the feedback given by and adjusts the simulator state accordingly.
   * A modal is shown if the user has made 3 mistakes in a row, asking if they want to be given the correct call.
   *
   * @param validationResult - The result of validation function
   * @returns void
   */
  function handleMistakes(validationResult: ValidationResult): boolean {
    // If scenario not loaded (no radio call), then do nothing
    if (!currentRadioCall) {
      return false;
    }

    // Update stores with the radio call and feedback
    const currentAttempt =
      currentRadioCall.attempts[currentRadioCall.attempts.length - 1];
    if (currentAttempt == undefined) {
      throw new Error("No current attempt");
    }
    currentAttempt.mistakes = validationResult.mistakes;

    pushRadioCallToHistory(currentRadioCall);

    if (liveFeedback) {
      // Do nothing if the call was flawless
      if (validationResult.mistakes.length !== 0) {
        // Show current mistakes
        toast.message("Correct with minor mistakes", {
          description: validationResult.mistakes.join("<br>"),
        });
      }
    }

    // Get whether there are severe mistakes, and record all minor ones
    const callsignMentioned: boolean = callContainsUserCallsign(
      currentAttempt.message,
      callsign,
      prefix,
    );

    // Handle mistakes
    if (validationResult.mistakes.length > 0) {
      failedAttempts++;

      if (failedAttempts >= 3) {
        // Show a modal asking the user if they want to be given the correct call or keep trying
        repeatMistakeDialogOpen = true;

        return false;
      }

      // Make ATC respond with say again and do not advance the simulator
      if (callsignMentioned) {
        if (isCallsignStandardRegistration(callsign)) {
          MostRecentlyReceivedMessageStore.set(
            prefix + " " + replaceWithPhoneticAlphabet(callsign) + " Say Again",
          );
        } else {
          MostRecentlyReceivedMessageStore.set(
            prefix + " " + callsign + " Say Again",
          );
        }
      } else {
        MostRecentlyReceivedMessageStore.set(
          "Station Calling, Say Again Your Callsign",
        );
      }

      return false;
    } else {
      toast.message("Flawless");
    }

    // Reset failed attempts
    failedAttempts = 0;

    return true;
  }

  /**
   * Handles the submit radio message event
   *
   * @remarks
   * This function handles the submit event and checks the user's radio call.
   * Gives feedback, adjusting the simulator state accordingly.
   *
   * @returns void
   */
  function handleSubmit(userMessage: string): void {
    // Check the call is not empty
    if (
      userMessage == undefined ||
      userMessage == "" ||
      userMessage == "Enter your radio message here."
    ) {
      return;
    }

    // Check sim state matches expected state
    if (scenarioId == undefined) {
      return;
    }

    // Ensure the client state is correct for this call
    // (adjustable elements e.g. transponder frequency)
    if (!checkClientSimStateCorrect()) {
      return;
    }

    const currentScenarioPoint = scenarioPoints[scenarioPointIndex];
    if (currentScenarioPoint == undefined) {
      throw new Error("No current scenario point");
    }

    console.log(`User message: ${userMessage}`);

    const result: ValidationResult = validator.validateCall(
      currentScenarioPoint.stage,
      userMessage,
    );

    // Adjust the simulator state based on the feedback
    if (!handleMistakes(result)) return;

    // If the user has reached the end of the route, then show a modal asking if they want to view their feedback
    if (currentRoutePointIndex == endPointIndex) {
      endOfRouteDialogOpen = true;
      return;
    }

    // Update the simulator with the next scenario point
    setScenarioPointIndex(scenarioPointIndex + 1);
    setMostRecentlyRecievedATCRadioCall(userMessage);
  }

  if (scenarioId == undefined) {
    // Replace later with a dialog asking the user to enter a scenario seed and generate it on the fly
    return <div>No scenario loaded</div>;
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="w-full max-w-screen-lg p-5">
        <Dialog open={endOfRouteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Scenario Complete</DialogTitle>
              <DialogDescription>
                Well done. You can now view your feedback.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-row place-content-between">
              <Button
                onClick={() => {
                  endOfRouteDialogOpen = false;
                }}
              >
                Close
              </Button>
              <Link
                href={`/scenario/${scenarioId}/results`}
                className={buttonVariants({ variant: "outline" })}
              >
                View Feedback
              </Link>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={repeatMistakeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Repeat Mistakes</DialogTitle>
              <DialogDescription>
                Would you like to be given the correct radio call?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-row place-content-between">
              <Button
                onClick={() => {
                  repeatMistakeDialogOpen = false;
                  userMessage = currentRadioCall?.expectedMessage;
                }}
              >
                Get Correct Call
              </Button>
              <Button
                onClick={() => {
                  repeatMistakeDialogOpen = false;
                  failedAttempts = -2;
                }}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex flex-row flex-wrap place-content-center gap-5">
          <div className="flex w-full flex-col place-content-evenly gap-5 sm:grid sm:grid-cols-2">
            <MessageOutputBox />

            <MessageInputBox
              speechRecognitionSupported={speechRecognitionSupported}
              onMessageSubmitted={handleSubmit}
              onLiveFeedbackSettingChanged={(liveFeedback) => !liveFeedback}
              onSpeechInputSettingChanged={(speechInput) => !speechInput}
              message={userMessage}
            />
          </div>

          <Radio onSpeechInput={(transcript) => (userMessage = transcript)} />

          <Transponder />

          <div className="card flex h-[452px] w-[420px] grow flex-row rounded-md bg-neutral-600 p-2">
            <div className="h-full w-full">
              <SimulatorMap className="rounded-md" />
            </div>
          </div>

          <Altimeter altitude={0} pressure={1013} />

          <div className="flex w-full flex-row flex-wrap gap-5 p-2 text-neutral-600/50">
            <div>
              Your callsign: {"prefix"}
              {"callsign"}
            </div>
            <div>Your aircraft type: {"aircraftType"}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;

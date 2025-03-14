/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import { type ParseResult } from "zod";
import Parser from "~/lib/radio-calls/parser";
import type Scenario from "~/lib/scenario";
import { generateScenario } from "~/lib/scenario/scenario-generator";
import { isCallsignStandardRegistration } from "~/lib/sim-utils/callsigns";
import { replaceWithPhoneticAlphabet } from "~/lib/sim-utils/phonetics";
import { type Airport } from "~/lib/types/airport";
import { type Airspace } from "~/lib/types/airspace";
import {
  type RadioCall,
  type RadioMessageAttempt,
} from "~/lib/types/radio-call";
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
import { type Waypoint } from "~/lib/types/waypoint";

type SimulatorProps = {
  className?: string;
  scenarioId?: number;
  startPointIndex?: number;
  endPointIndex?: number;
  waypoints?: Waypoint[];
  airspacesOnRouteIds?: string[];
  airportsOnRouteIds?: string[];
};

const Simulator = ({
  className,
  scenarioId,
  startPointIndex,
  endPointIndex,
  waypoints,
  airspacesOnRouteIds,
  airportsOnRouteIds,
}: SimulatorProps) => {
  console.log(scenarioId);

  // Simulator state and settings
  const radioDialMode = useRadioStore((state) => state.dialMode);
  const radioActiveFrequency = useRadioStore((state) => state.activeFrequency);

  const transponderDialMode = useTransponderStore((state) => state.dialMode);
  const transponderFrequency = useTransponderStore((state) => state.frequency);

  const altimeterPressure = useAltimeterStore((state) => state.shownPressure);

  const atcMessage = "";
  let userMessage = "";
  let currentTarget: string;
  let currentTargetFrequency: string;
  const currentRoutePointIndex = 0;
  let failedAttempts = 0;
  let currentRadioCall: RadioCall;
  let currentMessageAttempt: RadioMessageAttempt;
  let currentSimContext: string;

  // Page settings
  const speechRecognitionSupported = false; // Speech recognition is not supported in all browsers e.g. firefox - can be resolved with a polyfill
  const speechNoiseLevel = 0;
  const readRecievedCalls = false;
  const liveFeedback = false;
  let endOfRouteDialogOpen = false;
  let dialogTitle = "";
  let dialogDescription = "";

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
      scenario?.getCurrentPoint().updateData.currentTargetFrequency
    ) {
      toast.message("Error", { description: "Radio frequency incorrect" });
      return false;
    } else if (
      transponderFrequency !=
      scenario?.getCurrentPoint().updateData.currentTransponderFrequency
    ) {
      toast.message("Error", {
        description: "Transponder frequency incorrect",
      });
      return false;
    } else if (
      altimeterPressure !=
      scenario?.getCurrentPoint().updateData.currentPressure
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
   * @param parseResult - The result of parsing
   * @returns void
   */
  function handleFeedback(parseResult: ParseResult): boolean {
    // Update stores with the radio call and feedback
    const feedback = parseResult.feedback;

    currentRadioCall.setFeedback(feedback);
    RadioCallsHistoryStore.update((value) => {
      value.push(currentRadioCall);
      return value;
    });

    if (liveFeedback) {
      // Do nothing if the call was flawless
      if (!feedback.isFlawless()) {
        // Show current mistakes
        const t: ToastSettings = {
          message: feedback.getMistakes().join("<br>"),
          timeout: 15000,
          hoverable: true,
          background: "variant-filled-warning",
        };
        toastStore.trigger(t);
      }
    }

    // Get whether there are severe mistakes, and record all minor ones
    const callsignMentioned: boolean =
      currentRadioCall.callContainsUserCallsign();
    const minorMistakes: string[] = feedback.getMinorMistakes();
    const severeMistakes: string[] = feedback.getSevereMistakes();

    // Handle mistakes
    if (severeMistakes.length > 0) {
      failedAttempts++;

      if (failedAttempts >= 3) {
        // Show a modal asking the user if they want to be given the correct call or keep trying
        const m: ModalSettings = {
          type: "confirm",
          title: "Mistake",
          body: "Do you want to be given the correct call?",
          response: (r: boolean) => {
            if (r) {
              // Put the correct call in the input box
              ExpectedUserMessageStore.set(parseResult.expectedUserCall);
            } else {
              failedAttempts = -7;
            }
          },
        };
        modalStore.trigger(m);

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
    } else if (minorMistakes.length > 0) {
      // Show a toast with the minor mistakes and advance scenario
      toast.message("Correct with minor mistakes", {
        description: minorMistakes.join("<br>"),
      });
    } else {
      toast.message("Correct");
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
    if (scenario == undefined) {
      console.log("Error: No route");
      modalStore.trigger({
        type: "alert",
        title: "Scenario Error",
        body: "No scenario is loaded. Refresh the page to try again.",
      });
      return;
    }

    // Ensure the client state is correct for this call
    // (adjustable elements e.g. transponder frequency)
    if (!checkClientSimStateCorrect()) {
      return;
    }

    console.log(`User message: ${userMessage}`);

    // Create radio call object
    currentMessageAttempt = {
      message: userMessage,
    };

    // Check the call is valid
    const response = Parser.parseCall(currentRadioCall);

    // Adjust the simulator state based on the feedback
    if (!handleFeedback(response)) return;

    // If the user has reached the end of the route, then show a modal asking if they want to view their feedback
    if (currentRoutePointIndex == endPointIndex) {
      endOfRouteDialogOpen = true;
      return;
    }

    // Update the simulator with the next scenario point
    CurrentScenarioPointIndexStore.update((value) => {
      value++;
      return value;
    });
    MostRecentlyReceivedMessageStore.set(response.responseCall);
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

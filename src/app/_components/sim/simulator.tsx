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
import { type WaypointURLObject } from "~/lib/types/scenario";
import { type AltimeterState } from "~/lib/types/simulator";
import { type Waypoint } from "~/lib/types/waypoint";
import Altimeter from "./altimeter";
import Transponder from "./transponder";
import MessageOutputBox from "./message-output-box";
import MessageInputBox from "./message-input-box";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useMemo } from "react";

type SimulatorProps = {
  className?: string;
  loadFromURL?: boolean;
};

const Simulator = ({ className, loadFromURL = true }: SimulatorProps) => {
  const router = useRouter();

  // Scenario settings
  let seed = "";
  let hasEmergencies = false;
  let callsign = "G-OFLY";
  let prefix = "";
  let aircraftType = "Cessna 172";

  // Flag to check if critical data is missing and the user must be prompted to enter it
  let criticalDataMissing = false;

  // Scenario objects
  let waypoints: Waypoint[] = [];
  let airportIDs: string[] = [];

  // Simulator state and settings
  let radioDialMode = useRadioStore((state) => state.dialMode);
  let radioActiveFrequency = useRadioStore((state) => state.activeFrequency);

  let transponderDialMode = useTransponderStore((state) => state.dialMode);
  let transponderFrequency = useTransponderStore((state) => state.frequency);

  let altimeterState: AltimeterState;
  let atcMessage: string = "";
  let userMessage: string;
  let currentTarget: string;
  let currentTargetFrequency: string;
  let currentRoutePointIndex = 0;
  let failedAttempts = 0;
  let currentRadioCall: RadioCall;
  let currentMessageAttempt: RadioMessageAttempt;
  let currentSimConext: string;

  // Page settings
  let speechRecognitionSupported = false; // Speech recognition is not supported in all browsers e.g. firefox - can be resolved with a polyfill
  let speechInput: boolean;
  let speechNoiseLevel = 0;
  let readRecievedCalls = false;
  let liveFeedback = false;
  let tutorialStep4 = false;
  let dialogOpen = false;
  let dialogTitle = "";
  let dialogDescription = "";

  // Tutorial state
  let tutorialEnabled = false;
  let tutorialComplete = false;
  let tutorialStep = 1;

  // Server state
  let nullRoute = false;

  if (loadFromURL) {
    const searchParams = useSearchParams();
    const seedString = searchParams.get("seed");
    const hasEmergencyString = searchParams.get("hasEmergency");
    const waypointsString = searchParams.get("waypoints");
    const airportsString = searchParams.get("airports");
    const callsignString = searchParams.get("callsign");
    const prefixString = searchParams.get("prefix");
    const aircraftTypeString = searchParams.get("aircraftType");
    const startPointIndexString = searchParams.get("startPoint");
    const endPointIndexString = searchParams.get("endPoint");
    const tutorialString = searchParams.get("tutorial");

    // Check whether the seed is specified - if not then warn user
    if (seedString != null && seedString != "") {
      seed = seedString;
    } else {
      criticalDataMissing = true;
      throw new Error("Seed not specified");
    }

    // Check whether the hasEmergency is specified
    if (hasEmergencyString != null) {
      hasEmergencies = hasEmergencyString === "true";
    }

    // Get waypoints from the URL's JSON.stringify form
    if (waypointsString != null) {
      const waypointsDataArray: WaypointURLObject[] =
        JSON.parse(waypointsString);
      waypoints = waypointsDataArray.map((waypoint: WaypointURLObject) => {
        return {
          id: waypoint.id,
          type: waypoint.type,
          location: waypoint.location,
          name: waypoint.name,
          index: waypoint.index,
          referenceObjectId: waypoint.referenceObjectId,
          description: waypoint.description,
        };
      });
      // WaypointsStore.set(waypoints);
    } else {
      criticalDataMissing = true;
    }

    // Get airports from the URL's JSON.stringify form
    if (airportsString != null) {
      airportIDs = airportsString.split(",");
    } else {
      criticalDataMissing = true;
    }

    // Check whether the callsign is specified
    if (callsignString != null && callsignString != "") {
      callsign = callsignString;
    }

    // Check whether the prefix is specified
    if (prefixString != null) {
      if (
        prefixString == "" ||
        prefixString == "STUDENT" ||
        prefixString == "HELICOPTER" ||
        prefixString == "POLICE" ||
        prefixString == "SUPER" ||
        prefixString == "FASTJET" ||
        prefixString == "FASTPROP"
      ) {
        prefix = prefixString;
      }
    }

    // Check whether the aircraft type is specified
    if (aircraftTypeString != null && aircraftTypeString != "") {
      aircraftType = aircraftTypeString;
    }

    // Check whether start point index has been set
    let startPointIndex = 0;
    if (startPointIndexString != null) {
      startPointIndex = parseInt(startPointIndexString);
      if (startPointIndex < 0) {
        startPointIndex = 0;
      }
    }

    // Check whether end point index has been set
    let endPointIndex = -1;
    if (endPointIndexString != null) {
      endPointIndex = parseInt(endPointIndexString);
      if (endPointIndex < 0 || endPointIndex >= startPointIndex) {
        endPointIndex = -1;
      }
    }

    if (tutorialString != null) {
      tutorialEnabled = tutorialString === "true";
    }
  }

  // Load stores if not populated
  let airspaces: Airspace[] = [];
  //   AllAirspacesStore.subscribe((value) => {
  //     airspaces = value;
  //   });
  //   if (airspaces.length === 0) fetchAirspaces();

  let onRouteAirspaces: Airspace[] = [];
  //   OnRouteAirspacesStore.subscribe((value) => {
  //     onRouteAirspaces = value;
  //   });

  let airports: Airport[] = [];
  //   AllAirportsStore.subscribe((value) => {
  //     airports = value;
  //   });
  //   if (airports.length === 0) fetchAirports();

  let onRouteAirports: Airport[] = [];
  //   OnRouteAirportsStore.subscribe((value) => {
  //     onRouteAirports = value;
  //   });

  //   WaypointsStore.subscribe((value) => {
  //     waypoints = value;
  //   });

  let scenario: Scenario | undefined = undefined;

  if (criticalDataMissing) {
    // Set a short timeout then trigger modal to load scenario data
    // setTimeout(() => {
    //   const modal: ModalSettings = {
    //     type: "component",
    //     component: "quickLoadScenarioDataComponent",
    //     response: (r: any) => {
    //       if (r) {
    //         seed = r.scenarioSeed;
    //         hasEmergencies = r.hasEmergencies;
    //         loadScenario();
    //       }
    //     },
    //   };
    //   modalStore.trigger(modal);
    // }, 1000);

    throw new Error("Critical data missing");
  }

  $: if (!criticalDataMissing && airports.length > 0 && airspaces.length > 0) {
    loadScenario();
  }

  function loadScenario() {
    try {
      scenario = generateScenario(
        seed,
        waypoints,
        onRouteAirports,
        onRouteAirspaces,
        hasEmergencies,
      );
    } catch (e) {
      console.error(e);
      return;
    }

    // ScenarioStore.set(scenario);

    // if (endPointIndex == -1) {
    //   EndPointIndexStore.set(scenario.scenarioPoints.length - 1);
    // } else {
    //   EndPointIndexStore.set(endPointIndex);
    // }
  }

  //   ScenarioStore.set(scenario);
  //   CurrentScenarioPointIndexStore.set(startPointIndex);
  //   StartPointIndexStore.set(startPointIndex);

  //   TutorialStore.set(tutorial);
  //   AircraftDetailsStore.set({
  //     callsign: callsign,
  //     prefix: prefix,
  //     aircraftType: aircraftType,
  //   });

  if (nullRoute) {
    dialogTitle = "No Route Generated";
    dialogDescription =
      "After 1000 iterations no feasible route was generated for this seed. Please try another one. The route generation is not finalised and will frequently encounter issues like this one. ";
  }

  useMemo(() => {
    if (readRecievedCalls && atcMessage) {
      TTSWithNoise(speechNoiseLevel);
    }
  }, [readRecievedCalls, atcMessage]);

  //   $: tutorialStep2 =
  //     transponderState?.dialMode == "SBY" && radioState?.dialMode == "SBY";
  //   $: tutorialStep3 =
  //     radioState?.activeFrequency ==
  //     scenario?.getCurrentPoint().updateData.currentTargetFrequency;

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
      altimeterState.pressure !=
      scenario?.getCurrentPoint().updateData.currentPressure
    ) {
      // modalStore.trigger({
      // 	type: 'alert',
      // 	title: 'Error',
      // 	body: 'Altimeter pressure setting incorrect'
      // });
      // return false;
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
    let callsignMentioned: boolean =
      currentRadioCall.callContainsUserCallsign();
    let minorMistakes: string[] = feedback.getMinorMistakes();
    let severeMistakes: string[] = feedback.getSevereMistakes();

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

    tutorialStep4 = true;
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

    // console.log(
    //   `currentRadioCall: ${currentRadioCall.attempts[currentRadioCall.attempts.length - 1]?.message}`,
    // );

    // Check the call is valid
    const response = Parser.parseCall(currentRadioCall);

    // Adjust the simulator state based on the feedback
    if (!handleFeedback(response)) return;

    // If the user has reached the end of the route, then show a modal asking if they want to view their feedback
    if (currentRoutePointIndex == endPointIndex) {
      const m: ModalSettings = {
        type: "confirm",
        title: "Scenario Complete",
        body: "Do you want view your feedback?",
        response: (r: boolean) => {
          if (r) {
            router.push("/scenario/results/");
          }
        },
      };
      modalStore.trigger(m);

      return;
    }

    // Update the simulator with the next scenario point
    CurrentScenarioPointIndexStore.update((value) => {
      value++;
      return value;
    });
    MostRecentlyReceivedMessageStore.set(response.responseCall);
  }

  function onStepHandler(e: {
    detail: { state: { current: number; total: number }; step: number };
  }): void {
    tutorialStep = e.detail.state.current + 1;
  }

  function onCompleteHandler(e: Event): void {
    tutorialComplete = true;
  }

  function cancelTutorial(): void {
    tutorialEnabled = false;
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="w-full max-w-screen-lg p-5">
        <Dialog open={dialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>{dialogDescription}</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <div className="flex flex-row flex-wrap place-content-center gap-5">
          {/* {#if tutorialEnabled && !tutorialComplete} */}
          {/* <div className="card bg-primary-900 rounded-lg p-3 text-white sm:mx-10 sm:w-7/12">
            <Stepper on:complete={onCompleteHandler} on:step={onStepHandler}>
              <Step>
                <svelte:fragment slot="header">Get Started!</svelte:fragment>
                Welcome to RT Trainer. This tutorial will explain how to use the
                simulator.
                <br />
                Click
                <span className="underline">next</span>
                to continue.
                <svelte:fragment slot="navigation">
                  <button
                    className="btn variant-ghost-warning"
                    on:click={cancelTutorial}
                  >
                    Skip Tutorial
                  </button>
                </svelte:fragment>
              </Step>
              <Step locked={!tutorialStep2}>
                <svelte:fragment slot="header">
                  Turning on your Radio Stack
                </svelte:fragment>
                <ul className="ml-5 list-disc">
                  <li>
                    Turn on your radio by clicking on the dial or standby (SBY)
                    label.
                  </li>
                  <li>Set your transponder to standby in the same way.</li>
                </ul>
              </Step>
              <Step locked={!tutorialStep3}>
                <svelte:fragment slot="header">
                  Setting Your Radio Frequency
                </svelte:fragment>
                Set your radio frequency to the current target frequency shown
                in the message output box.
              </Step>
              <Step locked={!tutorialStep4}>
                <svelte:fragment slot="header">
                  Make your first Radio Call
                </svelte:fragment>
                Now you are ready to make your first radio call.
                <ul className="ml-5 list-disc">
                  <li>Type your message in the input box.</li>
                  <li>Or enable speech input and say your message out loud.</li>
                  <li>
                    Your callsign is `{prefix}
                    {callsign}`. You can change this in your
                    <a href="/profile">profile settings</a>.
                  </li>
                </ul>
              </Step>
              <Step>
                <svelte:fragment slot="header">Well Done!</svelte:fragment>
                You have completed the basic tutorial. Familiarise yourself with
                the rest of the simulator and complete the route.
              </Step>
            </Stepper>
          </div> */}
          {/* {/if} */}

          <div className="flex flex-col place-content-evenly gap-5 sm:grid sm:grid-cols-2">
            <MessageOutputBox />

            <MessageInputBox
              speechRecognitionSupported={speechRecognitionSupported}
              onMessageSubmitted={handleSubmit}
              onLiveFeedbackSettingChanged={(liveFeedback) => !liveFeedback}
              onSpeechInputSettingChanged={(speechInput) => !speechInput}
            />
          </div>

          <Radio />

          <Transponder />

          <div className="card flex h-[452px] w-[420px] grow flex-row rounded-md bg-neutral-600 p-2">
            <div className="h-full w-full">
              <SimulatorMap />
            </div>
          </div>

          <Altimeter />

          <div className="flex w-full flex-row flex-wrap gap-5 p-2 text-neutral-600/50">
            <div>
              Your callsign: {prefix}
              {callsign}
            </div>
            <div>Your aircraft type: {aircraftType}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;

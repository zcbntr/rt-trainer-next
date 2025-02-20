import { index } from "drizzle-orm/pg-core";
import { Radio } from "lucide-react";
import { Marker, Popup } from "mapbox-gl";
import { ParseResult } from "zod";
import Parser from "~/lib/radio-calls/parser";
import Scenario from "~/lib/scenario/scenario";
import { generateScenario } from "~/lib/scenario/scenario-generator";
import { isCallsignStandardRegistration } from "~/lib/sim-utils/callsigns";
import { replaceWithPhoneticAlphabet } from "~/lib/sim-utils/phonetics";
import { Airport } from "~/lib/types/airport";
import { Airspace } from "~/lib/types/airspace";
import { RadioCall } from "~/lib/types/radio-call";
import { WaypointURLObject } from "~/lib/types/scenario";
import { AircraftDetails, AltimeterState, RadioState, TransponderState } from "~/lib/types/simulator";
import { Waypoint } from "~/lib/types/waypoint";
import Altimeter from "./altimeter";

const Simulator = () => {

	const modalStore = getModalStore();

	// Scenario settings
	let seed: string = '';
	let hasEmergencies: boolean = false;
	let callsign: string = 'G-OFLY';
	let prefix: string = '';
	let aircraftType: string = 'Cessna 172';

	// Flag to check if critical data is missing and the user must be prompted to enter it
	let criticalDataMissing: boolean = false;

	// Scenario objects
	let waypoints: Waypoint[] = [];
	let airportIDs: string[] = [];

	// Check whether the seed is specified - if not then warn user
	const seedString: string | null = $page.url.searchParams.get('seed');
	if (seedString != null && seedString != '') {
		seed = seedString;
	} else {
		criticalDataMissing = true;
	}

	// Check whether the hasEmergency is specified
	const hasEmergencyString: string | null = $page.url.searchParams.get('hasEmergency');
	if (hasEmergencyString != null) {
		hasEmergencies = hasEmergencyString === 'true';
	}

	// Get waypoints from the URL's JSON.stringify form
	const waypointsString: string | null = $page.url.searchParams.get('waypoints');
	if (waypointsString != null) {
		const waypointsDataArray: WaypointURLObject[] = JSON.parse(waypointsString);
		waypoints = waypointsDataArray.map(
			(waypoint) =>
				new Waypoint(
					waypoint.name,
					waypoint.location,
					waypoint.type,
					waypoint.index,
					waypoint.referenceObjectId
				)
		);
		WaypointsStore.set(waypoints);
	} else {
		criticalDataMissing = true;
	}

	// Get airports from the URL's JSON.stringify form
	const airportsString: string | null = $page.url.searchParams.get('airports');
	if (airportsString != null) {
		airportIDs = airportsString.split(',');
	} else {
		criticalDataMissing = true;
	}

	// Check whether the callsign is specified
	const callsignString: string | null = $page.url.searchParams.get('callsign');
	if (callsignString != null && callsignString != '') {
		callsign = callsignString;
	}

	// Check whether the prefix is specified
	const prefixString: string | null = $page.url.searchParams.get('prefix');
	if (prefixString != null) {
		if (
			prefixString == '' ||
			prefixString == 'STUDENT' ||
			prefixString == 'HELICOPTER' ||
			prefixString == 'POLICE' ||
			prefixString == 'SUPER' ||
			prefixString == 'FASTJET' ||
			prefixString == 'FASTPROP'
		) {
			prefix = prefixString;
		}
	}

	// Check whether the aircraft type is specified
	const aircraftTypeString: string | null = $page.url.searchParams.get('aircraftType');
	if (aircraftTypeString != null && aircraftTypeString != '') {
		aircraftType = aircraftTypeString;
	}

	// Check whether start point index has been set
	let startPointIndex: number = 0;
	const startPointIndexString: string | null = $page.url.searchParams.get('startPoint');
	if (startPointIndexString != null) {
		startPointIndex = parseInt(startPointIndexString);
		if (startPointIndex < 0) {
			startPointIndex = 0;
		}
	}

	// Check whether end point index has been set
	let endPointIndex: number = -1;
	const endPointIndexString: string | null = $page.url.searchParams.get('endPoint');
	if (endPointIndexString != null) {
		endPointIndex = parseInt(endPointIndexString);
		if (endPointIndex < 0 || endPointIndex >= startPointIndex) {
			endPointIndex = -1;
		}
	}

	let tutorial: boolean = false;
	const tutorialString: string | null = $page.url.searchParams.get('tutorial');
	if (tutorialString != null) {
		tutorial = tutorialString === 'true';
	}

	// Load stores if not populated
	let airspaces: Airspace[] = [];
	AllAirspacesStore.subscribe((value) => {
		airspaces = value;
	});
	if (airspaces.length === 0) fetchAirspaces();

	let onRouteAirspaces: Airspace[] = [];
	OnRouteAirspacesStore.subscribe((value) => {
		onRouteAirspaces = value;
	});

	let airports: Airport[] = [];
	AllAirportsStore.subscribe((value) => {
		airports = value;
	});
	if (airports.length === 0) fetchAirports();

	let onRouteAirports: Airport[] = [];
	OnRouteAirportsStore.subscribe((value) => {
		onRouteAirports = value;
	});

	WaypointsStore.subscribe((value) => {
		waypoints = value;
	});

	let scenario: Scenario | undefined = undefined;

	if (criticalDataMissing) {
		// Set a short timeout then trigger modal to load scenario data
		setTimeout(() => {
			const modal: ModalSettings = {
				type: 'component',
				component: 'quickLoadScenarioDataComponent',
				response: (r: any) => {
					if (r) {
						seed = r.scenarioSeed;
						hasEmergencies = r.hasEmergencies;
						loadScenario();
					}
				}
			};
			modalStore.trigger(modal);
		}, 1000);
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
				hasEmergencies
			);
		} catch (e) {
			console.error(e);
			return;
		}

		ScenarioStore.set(scenario);

		if (endPointIndex == -1) {
			EndPointIndexStore.set(scenario.scenarioPoints.length - 1);
		} else {
			EndPointIndexStore.set(endPointIndex);
		}
	}

	ScenarioStore.set(scenario);
	CurrentScenarioPointIndexStore.set(startPointIndex);
	StartPointIndexStore.set(startPointIndex);

	TutorialStore.set(tutorial);
	AircraftDetailsStore.set({
		callsign: callsign,
		prefix: prefix,
		aircraftType: aircraftType
	});

	// Simulator state and settings
	let aircraftDetails: AircraftDetails; // Current settings of the simulator
	let radioState: RadioState; // Current radio settings
	let transponderState: TransponderState; // Current transponder settings
	let altimeterState: AltimeterState;
	let atcMessage: string;
	let userMessage: string;
	let currentTarget: string;
	let currentTargetFrequency: string;
	let currentRoutePointIndex: number = 0;
	let failedAttempts: number = 0;
	let currentRadioCall: RadioCall;
	let currentSimConext: string;

	// Page settings
	let speechRecognitionSupported: boolean = false; // Speech recognition is not supported in all browsers e.g. firefox
	let speechNoiseLevel: number = 0;
	let readRecievedCalls: boolean = false;
	let liveFeedback: boolean = false;
	let tutorialStep4: boolean = false;

	// Tutorial state
	let tutorialEnabled: boolean = false;
	let tutorialComplete: boolean = false;
	let tutorialStep: number = 1;

	// Server state
	let awaitingRadioCallCheck: boolean = false;
	let serverNotResponding: boolean = false;
	let nullRoute: boolean = false;

	const toastStore = getToastStore();

	$: if (serverNotResponding) {
		modalStore.trigger({
			type: 'alert',
			title: 'Server did not respond',
			body: 'This may be due to a bad request or the feature you are trying to use not being implemented yet. This software is still early in development, expect errors like this one.'
		});
	}

	$: if (nullRoute) {
		modalStore.trigger({
			type: 'alert',
			title: 'No Route Generated',
			body: 'After 1000 iterations no feasible route was generated for this seed. Please try another one. The route generation is not finalised and will frequently encounter issues like this one. '
		});
	}

	$: if (readRecievedCalls && atcMessage) {
		TTSWithNoise(speechNoiseLevel);
	}

	$: tutorialStep2 = transponderState?.dialMode == 'SBY' && radioState?.dialMode == 'SBY';
	$: tutorialStep3 =
		radioState?.activeFrequency == scenario?.getCurrentPoint().updateData.currentTargetFrequency;

	ScenarioStore.subscribe((value) => {
		scenario = value;
	});

	SpeechOutputEnabledStore.subscribe((value) => {
		readRecievedCalls = value;
	});

	SpeechNoiseStore.subscribe((value) => {
		speechNoiseLevel = value;
	});

	LiveFeedbackStore.subscribe((value) => {
		liveFeedback = value;
	});

	AircraftDetailsStore.subscribe((value) => {
		aircraftDetails = value;
	});

	RadioStateStore.subscribe((value) => {
		radioState = value;
	});

	TransponderStateStore.subscribe((value) => {
		transponderState = value;
	});

	AltimeterStateStore.subscribe((value) => {
		altimeterState = value;
	});

	UserMessageStore.subscribe((value) => {
		userMessage = value;
	});

	MostRecentlyReceivedMessageStore.subscribe((value) => {
		atcMessage = value;
	});

	CurrentScenarioContextStore.subscribe((value) => {
		currentSimConext = value;
	});

	CurrentScenarioPointIndexStore.subscribe((value) => {
		currentRoutePointIndex = value;
	});

	CurrentTargetStore.subscribe((value) => {
		currentTarget = value;
	});

	CurrentTargetFrequencyStore.subscribe((value) => {
		currentTargetFrequency = value;
	});

	TutorialStore.subscribe((value) => {
		tutorialEnabled = value;
	});

	let waypointPoints: number[][] = [];
	let bounds: L.LatLngBounds;
	let bbox: number[] = [];
	WaypointPointsMapStore.subscribe((value) => {
		waypointPoints = value;
	});

	let position: number[] = [0, 0];
	let displayHeading: number = 0;
	let altitude: number = 0;
	let airSpeed: number = 0;

	CurrentScenarioPointStore.subscribe((value) => {
		position = value?.pose.position.reverse() ?? [0, 0];
		displayHeading = value?.pose.trueHeading ? value?.pose.trueHeading - 45 : 0;
		altitude = value?.pose.altitude ?? 0;
		airSpeed = value?.pose.airSpeed ?? 0;
	});

	/**
	 * Reads out the current atc message using the speech synthesis API, with added static noise
	 *
	 * @remarks
	 * If the speech synthesis API is not supported in the current browser, then an error is logged to the console.
	 *
	 * @returns void
	 */
	function TTSWithNoise(noiseLevel: number): void {
		if ('speechSynthesis' in window) {
			// Get the speech synthesis API and audio context
			const synth = window.speechSynthesis;
			const audioContext = new AudioContext();

			// Create speech synthesis utterance and noise buffer
			const speech = new SpeechSynthesisUtterance(atcMessage);
			const noiseBuffer = generateStaticNoise(45, speech.rate * 44100);
			const noiseSource = new AudioBufferSourceNode(audioContext, { buffer: noiseBuffer });
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
			console.error('SpeechSynthesis API is not supported in this browser.');
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
		const buffer = new AudioBuffer({ length: bufferSize, numberOfChannels: 1, sampleRate });
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
		if (radioState.dialMode == 'OFF') {
			modalStore.trigger({
				type: 'alert',
				title: 'Error',
				body: 'Radio is off'
			});
			return false;
		} else if (transponderState.dialMode == 'OFF') {
			modalStore.trigger({
				type: 'alert',
				title: 'Error',
				body: 'Transponder is off'
			});
			return false;
		} else if (
			radioState.activeFrequency != scenario?.getCurrentPoint().updateData.currentTargetFrequency
		) {
			modalStore.trigger({
				type: 'alert',
				title: 'Error',
				body: 'Radio frequency incorrect'
			});
			return false;
		} else if (
			transponderState.frequency !=
			scenario?.getCurrentPoint().updateData.currentTransponderFrequency
		) {
			modalStore.trigger({
				type: 'alert',
				title: 'Error',
				body: 'Transponder frequency incorrect'
			});
			return false;
		} else if (altimeterState.pressure != scenario?.getCurrentPoint().updateData.currentPressure) {
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
			// Clear previous toasts so only one feedback shown at a time
			toastStore.clear();

			// Do nothing if the call was flawless
			if (!feedback.isFlawless()) {
				// Show current mistakes
				const t: ToastSettings = {
					message: feedback.getMistakes().join('<br>'),
					timeout: 15000,
					hoverable: true,
					background: 'variant-filled-warning'
				};
				toastStore.trigger(t);
			}
		}

		// Get whether there are severe mistakes, and record all minor ones
		let callsignMentioned: boolean = currentRadioCall.callContainsUserCallsign();
		let minorMistakes: string[] = feedback.getMinorMistakes();
		let severeMistakes: string[] = feedback.getSevereMistakes();

		// Handle mistakes
		if (severeMistakes.length > 0) {
			failedAttempts++;

			if (failedAttempts >= 3) {
				// Show a modal asking the user if they want to be given the correct call or keep trying
				const m: ModalSettings = {
					type: 'confirm',
					title: 'Mistake',
					body: 'Do you want to be given the correct call?',
					response: (r: boolean) => {
						if (r) {
							// Put the correct call in the input box
							ExpectedUserMessageStore.set(parseResult.expectedUserCall);
						} else {
							failedAttempts = -7;
						}
					}
				};
				modalStore.trigger(m);

				return false;
			}

			// Make ATC respond with say again and do not advance the simulator
			if (callsignMentioned) {
				if (isCallsignStandardRegistration(aircraftDetails.callsign)) {
					MostRecentlyReceivedMessageStore.set(
						aircraftDetails.prefix +
							' ' +
							replaceWithPhoneticAlphabet(aircraftDetails.callsign) +
							' Say Again'
					);
				} else {
					MostRecentlyReceivedMessageStore.set(
						aircraftDetails.prefix + ' ' + aircraftDetails.callsign + ' Say Again'
					);
				}
			} else {
				MostRecentlyReceivedMessageStore.set('Station Calling, Say Again Your Callsign');
			}

			return false;
		} else if (minorMistakes.length > 0) {
			// Show a toast with the minor mistakes and advance scenario
			const t: ToastSettings = {
				message: 'Correct with minor mistakes: ' + minorMistakes.join('<br>') + '.'
			};
			toastStore.trigger(t);
		} else {
			const t: ToastSettings = {
				message: 'Correct!'
			};
			toastStore.trigger(t);
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
	function handleSubmit() {
		// Check the call is not empty
		if (
			userMessage == undefined ||
			userMessage == '' ||
			userMessage == 'Enter your radio message here.'
		) {
			return;
		}

		// Check sim state matches expected state
		if (scenario == undefined) {
			console.log('Error: No route');
			modalStore.trigger({
				type: 'alert',
				title: 'Scenario Error',
				body: 'No scenario is loaded. Refresh the page to try again.'
			});
			return;
		}

		// Ensure the client state is correct for this call
		// (adjustable elements e.g. transponder frequency)
		if (!checkClientSimStateCorrect()) {
			return;
		}

		console.log('User message: ' + userMessage);

		// Create radio call object
		currentRadioCall = new RadioCall(
			userMessage,
			scenario,
			aircraftDetails.prefix,
			aircraftDetails.callsign,
			scenario.getCurrentPoint().updateData.callsignModified,
			transponderState.vfrHasExecuted,
			currentTarget,
			currentTargetFrequency,
			radioState.activeFrequency,
			transponderState.frequency,
			aircraftDetails.aircraftType
		);

		console.log(currentRadioCall);

		// Check the call is valid
		const response = Parser.parseCall(currentRadioCall);

		// Adjust the simulator state based on the feedback
		if (!handleFeedback(response)) return;

		// If the user has reached the end of the route, then show a modal asking if they want to view their feedback
		if (currentRoutePointIndex == endPointIndex) {
			const m: ModalSettings = {
				type: 'confirm',
				title: 'Scenario Complete',
				body: 'Do you want view your feedback?',
				response: (r: boolean) => {
					if (r) {
						goto('/scenario/results/');
					}
				}
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

	onMount(async () => {
		if (window.SpeechRecognition || window.webkitSpeechRecognition) {
			speechRecognitionSupported = true;
		} else {
			speechRecognitionSupported = false;
		}
	});

return (<div className={`flex justify-center ${className}`}>
	<div className="w-full max-w-screen-lg p-5">
		<div className="flex flex-row place-content-center gap-5 flex-wrap">
			{/* {#if tutorialEnabled && !tutorialComplete} */}
				<div className="card bg-primary-900 text-white p-3 rounded-lg sm:w-7/12 sm:mx-10">
					<Stepper on:complete={onCompleteHandler} on:step={onStepHandler}>
						<Step>
							<svelte:fragment slot="header">Get Started!</svelte:fragment>
							Welcome to RT Trainer. This tutorial will explain how to use the simulator.
							<br />Click
							<span className="underline">next</span>
							to continue.
							<svelte:fragment slot="navigation">
								<button className="btn variant-ghost-warning" on:click={cancelTutorial}
									>Skip Tutorial</button
								>
							</svelte:fragment>
						</Step>
						<Step locked={!tutorialStep2}>
							<svelte:fragment slot="header">Turning on your Radio Stack</svelte:fragment>
							<ul className="list-disc ml-5">
								<li>Turn on your radio by clicking on the dial or standby (SBY) label.</li>
								<li>Set your transponder to standby in the same way.</li>
							</ul>
						</Step>
						<Step locked={!tutorialStep3}>
							<svelte:fragment slot="header">Setting Your Radio Frequency</svelte:fragment>
							Set your radio frequency to the current target frequency shown in the message output box.
						</Step>
						<Step locked={!tutorialStep4}>
							<svelte:fragment slot="header">Make your first Radio Call</svelte:fragment>
							Now you are ready to make your first radio call.
							<ul className="list-disc ml-5">
								<li>Type your message in the input box.</li>
								<li>Or enable speech input and say your message out loud.</li>
								<li>
									Your callsign is `{aircraftDetails.prefix}
									{aircraftDetails.callsign}`. You can change this in your
									<a href="/profile">profile settings</a>.
								</li>
							</ul>
						</Step>
						<Step>
							<svelte:fragment slot="header">Well Done!</svelte:fragment>
							You have completed the basic tutorial. Familiarise yourself with the rest of the simulator
							and complete the route.
						</Step>
					</Stepper>
				</div>
			{/* {/if} */}

			<div className="flex flex-col place-content-evenly sm:grid sm:grid-cols-2 gap-5">
				<MessageOutput />

				<MessageInput {speechRecognitionSupported} on:submit={handleSubmit} />
			</div>

			<Radio />

			<Transponder />

			<div className="card p-2 rounded-md w-[420px] h-[452px] bg-neutral-600 flex flex-row grow">
				<div className="w-full h-full">
					<Map view={scenario?.getCurrentPoint().pose.position} zoom={9}>
						{/* {#if waypointPoints.length > 0}
							{#each waypoints as waypoint (waypoint.index)}
								{#if waypoint.index == waypoints.length - 1 || waypoint.type == WaypointType.Airport} */}
									<Marker
										latLng={[waypoint.location[1], waypoint.location[0]]}
										width={50}
										height={50}
										aeroObject={waypoint}
										on:click={(e) => {
											e.preventDefault();
										}}
										on:mouseover={(e) => {
											e.detail.marker.openPopup();
										}}
										on:mouseout={(e) => {
											e.detail.marker.closePopup();
										}}
									>
										{/* {#if waypoint.index == waypoints.length - 1} */}
											<div className="text-2xl">🏁</div>
										{/* {:else if waypoint.type == WaypointType.Airport} */}
											<div className="text-2xl">🛫</div>
										{/* {/if} */}

										<Popup
											><div className="flex flex-col gap-2">
												<div>{waypoint.name}</div>
											</div></Popup
										></Marker
									>
								{/* {:else} */}
									<Marker
										latLng={[waypoint.location[1], waypoint.location[0]]}
										width={50}
										height={50}
										aeroObject={waypoint}
										iconAnchor={L.point(8, 26)}
										on:click={(e) => {
											e.preventDefault();
										}}
										on:mouseover={(e) => {
											e.detail.marker.openPopup();
										}}
										on:mouseout={(e) => {
											e.detail.marker.closePopup();
										}}
									>
										<div className="text-2xl">🚩</div>

										<Popup
											><div className="flex flex-col gap-2">
												<div>{waypoint.name}</div>
											</div></Popup
										></Marker
									>
								{/* {/if}
							{/each}
						{/if} */}

						{/* {#each waypointPoints as waypointPoint, index}
							{#if index > 0}
								<!-- Force redraw if either waypoint of the line changes location -->
								{#key [waypointPoints[index - 1], waypointPoints[index]]} */}
									<Polyline
										latLngArray={[waypointPoints[index - 1], waypointPoints[index]]}
										colour="#FF69B4"
										fillOpacity={1}
										weight={7}
									/>
								{/* {/key}
							{/if}
						{/each}

						{#each onRouteAirspaces as airspace}
							{#if airspace.type == 14} */}
								<Polygon
									latLngArray={airspace.coordinates[0].map((point) => [point[1], point[0]])}
									color={'red'}
									fillOpacity={0.2}
									weight={1}
									on:click={(e) => {
										e.preventDefault();
									}}
									on:mouseover={(e) => {
										e.detail.polygon.openPopup();
									}}
									on:mouseout={(e) => {
										e.detail.polygon.closePopup();
									}}
								/>
							{/* {:else} */}
								<Polygon
									latLngArray={airspace.coordinates[0].map((point) => [point[1], point[0]])}
									color={'blue'}
									fillOpacity={0.2}
									weight={1}
									on:click={(e) => {
										e.preventDefault();
									}}
									on:mouseover={(e) => {
										e.detail.polygon.openPopup();
									}}
									on:mouseout={(e) => {
										e.detail.polygon.closePopup();
									}}
								/>
							{/* {/if}
						{/each} */}

						{/* {#key position} */}
							<Marker latLng={position} width={50} height={50} rotation={displayHeading}>
								<div className="text-2xl">🛩️</div>

								<Popup
									><div className="flex flex-col gap-2">
										<div>
											{/* <!-- Lat, Long format --> */}
											<div>{position[1].toFixed(6)}</div>
											<div>{position[0].toFixed(6)}</div>
										</div>
									</div></Popup
								>
							</Marker>
						{/* {/key} */}
					</Map>
				</div>
			</div>

			<Altimeter />

			<div className="w-full flex flex-row flex-wrap gap-5 p-2 text-neutral-600/50">
				<div>
					Your callsign: {aircraftDetails.prefix}
					{aircraftDetails.callsign}
				</div>
				<div>
					Your aircraft type: {aircraftDetails.aircraftType}
				</div>
			</div>
		</div>
	</div>
</div>) }

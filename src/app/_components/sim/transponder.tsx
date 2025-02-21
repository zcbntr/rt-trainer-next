"use client";

import { type TransponderState } from "~/lib/types/simulator";
import FrequencyDial from "./frequency-dial";
import ModeDial from "./mode-dial";
import TransponderDisplay from "./transponder-display";

type TransponderProps = {
  className?: string;
  disabled?: boolean;
  turnedOn?: boolean;
};

const Transponder = ({
  className = "",
  disabled = false,
  turnedOn = true,
}: TransponderProps) => {
  const transponderDialModes: ArrayMaxLength7MinLength2 = [
    "OFF",
    "SBY",
    "GND",
    "ON",
    "ALT",
    "TEST",
  ];

  type ArrayMaxLength7MinLength2 = readonly [
    string,
    string,
    string?,
    string?,
    string?,
    string?,
    string?,
  ];

  // Holds current transponder state
  const transponderState: TransponderState = {
    dialMode: "OFF",
    frequency: "7000",
    identEnabled: false,
    vfrHasExecuted: false,
  };
  const dialModeIndex = 0;
  let displayOn = false;
  const digitArr = [7, 0, 0, 0];
  let frequency = "7000";
  let frequencyDialEnabled = false;
  let displayDigitSelected = 0;
  const mounted = false;

//   $: TransponderStateStore.set(transponderState);

//   $: if (mounted) {
//     frequency = digitArr.join("");
//     transponderState.frequency = frequency;
//   }

  // Trigger onTransponderDialModeChange when transponderDialMode changes
//   $: onTransponderDialModeChange(dialModeIndex);

  // Click handlers
  const handleIDENTButtonClick = () => {
    if (transponderState.dialMode != "OFF") {
      const IDENTModeButton = document.getElementById(
        "button-ident",
      ) as HTMLInputElement;
      // Make flash continuously when clicked, untill clicked again
      IDENTModeButton.classList.toggle("blink-continiously");
      transponderState.identEnabled = !transponderState.identEnabled;
    }
  };

  const handleVFRButtonClick = () => {
    if (transponderState.dialMode != "OFF") {
      const VFRModeButton = document.getElementById(
        "button-vfr",
      ) as HTMLInputElement;
      // Make flash on when pressed then remain off
      VFRModeButton.classList.toggle("blink-once");
      transponderState.identEnabled = true;
    }
  };

  const handleENTERButtonClick = () => {
    if (displayOn) {
      if (displayDigitSelected < 3) {
        displayDigitSelected += 1;
      } else {
        displayDigitSelected = 0;
      }
    }
  };

  const handleBACKButtonClick = () => {
    if (displayOn) {
      if (displayDigitSelected > 0) {
        displayDigitSelected -= 1;
      } else {
        displayDigitSelected = 3;
      }
    }
  };

  function onTransponderDialModeChange(newModeIndex: number) {
    if (newModeIndex == 0) {
      if (transponderState.identEnabled) {
        const IDENTModeButton = document.getElementById(
          "button-ident",
        ) as HTMLInputElement;
        IDENTModeButton.classList.remove("active-button");
        transponderState.identEnabled = false;
      }
      transponderState.dialMode = "OFF";
      displayOn = false;
      frequencyDialEnabled = false;
    } else {
      switch (newModeIndex) {
        case 1:
          transponderState.dialMode = "SBY";
          break;
        case 2:
          transponderState.dialMode = "GND";
          break;
        case 3:
          transponderState.dialMode = "ON";
          break;
        case 4:
          transponderState.dialMode = "ALT";
          break;
        case 5:
          transponderState.dialMode = "TEST";
          break;
      }

      displayOn = true;
      frequencyDialEnabled = true;
    }

    // Shouldnt need to do this here as we have a reactive statement for this, but it seems to be necessary
    // for the store to update when the dail mode changes
    TransponderStateStore.set(transponderState);
  }

  function onTransponderFrequencyIncrease() {
    if (digitArr[displayDigitSelected] == 7) {
      digitArr[displayDigitSelected] = 0;
    } else {
      digitArr[displayDigitSelected] += 1;
    }
  }

  function onTransponderFrequencyReduce() {
    if (digitArr[displayDigitSelected] == 0) {
      digitArr[displayDigitSelected] = 7;
    } else {
      digitArr[displayDigitSelected] -= 1;
    }
  }

  return (
    <div className="card flex max-w-screen-lg grow flex-row flex-wrap place-content-evenly gap-2 bg-neutral-600 p-3 text-white">
      <ModeDial modes={transponderDialModes} currentModeIndex={dialModeIndex} />

      <div className="display-panel order-first flex grow flex-col items-center justify-center sm:order-2">
        <TransponderDisplay
          DisplayOn={displayOn}
          mode={transponderDialModes[dialModeIndex]}
          digitArr={digitArr}
          DigitSelected={displayDigitSelected}
        />
        <div className="flex flex-row items-center gap-2 pt-1">
          <button
            className="button"
            id="button-ident"
            onClick={handleIDENTButtonClick}
          >
            IDENT
          </button>
          <button
            className="button"
            id="button-vfr"
            onClick={handleVFRButtonClick}
          >
            VFR
          </button>
          <button
            className="button"
            id="button-enter"
            onClick={handleENTERButtonClick}
          >
            ENT
          </button>
          <button
            className="button"
            id="button-back"
            onClick={handleBACKButtonClick}
          >
            BACK
          </button>
        </div>
      </div>

      <div className="order-3 mx-4 flex flex-row">
        <FrequencyDial
          turnedOn={frequencyDialEnabled}
          onAntiClockwiseTurn={onTransponderFrequencyReduce}
          onClockwiseTurn={onTransponderFrequencyIncrease}
        />
      </div>
    </div>
  );
};

export default Transponder;

// <style lang="postcss">
// 	.display-panel {
// 		max-width: 600px;
// 		min-width: 200px;
// 	}

// 	.button {
// 		width: 50px;
// 	}

// 	/* Global flag required otherwise .active-button is unused at page load
//     and hence removed by the compiler */
// 	:global(.active-button) {
// 		background-color: rgb(175, 165, 72);
// 		color: black;
// 	}

// 	:global(.blink-continiouosly) {
// 		animation: blinker 2s linear infinite;
// 	}

// 	:global(.blink-once) {
// 		animation: blinker 2s linear 1;
// 	}

// 	@keyframes blinker {
// 		25% {
// 			background-color: rgb(175, 165, 72, 1);
// 		}
// 		50% {
// 			background-color: rgba(175, 165, 72, 0);
// 		}
// 		75% {
// 			background-color: rgba(175, 165, 72, 1);
// 		}
// 	}
// </style>

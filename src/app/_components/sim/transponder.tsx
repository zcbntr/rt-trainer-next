"use client";

import { type TransponderDialMode } from "~/lib/types/simulator";
import FrequencyDial from "./frequency-dial";
import ModeDial from "./mode-dial";
import TransponderDisplay from "./transponder-display";
import useTransponderStore from "~/app/stores/transponder-slice";

type TransponderProps = {
  className?: string;
  disabled?: boolean;
  turnedOn?: boolean;
  initialFrequency?: string;
};

const Transponder = ({
  className = "",
  disabled = false,
  turnedOn = true,
  initialFrequency = "7000",
}: TransponderProps) => {
  if (initialFrequency.length != 4) {
    throw new Error("Initial frequency must be a 4 digit string");
  }

  const { dialMode, frequency, identEnabled, vfrHasExecuted } =
    useTransponderStore((state) => state);
  const setFrequency = useTransponderStore((state) => state.setFrequency);
  const setDialMode = useTransponderStore((state) => state.setDialMode);
  const setIdentEnabled = useTransponderStore((state) => state.setIdentEnabled);
  const setVFRHasExecuted = useTransponderStore(
    (state) => state.setVFRHasExecuted,
  );

  const transponderDialModes: ArrayMaxLength7MinLength2 = [
    "OFF",
    "SBY",
    "GND",
    "ON",
    "ALT",
    "TEST",
  ];

  type ArrayMaxLength7MinLength2 = readonly [
    TransponderDialMode,
    TransponderDialMode,
    TransponderDialMode?,
    TransponderDialMode?,
    TransponderDialMode?,
    TransponderDialMode?,
    TransponderDialMode?,
  ];

  const dialModeIndex = 0;
  let displayOn = false;

  setFrequency(initialFrequency);

  let frequencyDialEnabled = false;
  let displayDigitSelected = 0;

  // Click handlers
  const handleIDENTButtonClick = () => {
    if (dialMode != "OFF") {
      const IDENTModeButton = document.getElementById(
        "button-ident",
      ) as HTMLInputElement;
      // Make flash continuously when clicked, untill clicked again
      IDENTModeButton.classList.toggle("blink-continiously");
      setIdentEnabled(!identEnabled);
    }
  };

  const handleVFRButtonClick = () => {
    if (dialMode != "OFF") {
      const VFRModeButton = document.getElementById(
        "button-vfr",
      ) as HTMLInputElement;
      // Make flash on when pressed then remain off
      VFRModeButton.classList.toggle("blink-once");
      setVFRHasExecuted(true);
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

  function handleTransponderDialModeChange(newModeIndex: number) {
    if (newModeIndex == 0) {
      if (identEnabled) {
        const IDENTModeButton = document.getElementById(
          "button-ident",
        ) as HTMLInputElement;
        IDENTModeButton.classList.remove("active-button");
        setIdentEnabled(false);
      }
      setDialMode("OFF");
      displayOn = false;
      frequencyDialEnabled = false;
    } else {
      switch (newModeIndex) {
        case 1:
          setDialMode("SBY");
          break;
        case 2:
          setDialMode("GND");
          break;
        case 3:
          setDialMode("ON");
          break;
        case 4:
          setDialMode("ALT");
          break;
        case 5:
          setDialMode("TEST");
          break;
      }

      displayOn = true;
      frequencyDialEnabled = true;
    }
  }

  function onTransponderFrequencyIncrease() {
    if (frequency[displayDigitSelected] == "7") {
      const newFreq = frequency.split("");
      newFreq[displayDigitSelected] = "0";
      setFrequency(newFreq.join(""));
    } else {
      const val = parseInt(frequency[displayDigitSelected] ?? "0") ?? 0;
      const newFreq = frequency.split("");
      newFreq[displayDigitSelected] = (val + 1).toString();
      setFrequency(newFreq.join(""));
    }
  }

  function onTransponderFrequencyReduce() {
    if (frequency[displayDigitSelected] == "0") {
      const newFreq = frequency.split("");
      newFreq[displayDigitSelected] = "7";
      setFrequency(newFreq.join(""));
    } else {
      const val = parseInt(frequency[displayDigitSelected] ?? "0") ?? 0;
      const newFreq = frequency.split("");
      newFreq[displayDigitSelected] = (val - 1).toString();
      setFrequency(newFreq.join(""));
    }
  }

  return (
    <div
      className={`card flex max-w-screen-lg grow flex-row flex-wrap place-content-evenly gap-2 bg-neutral-600 p-3 text-white ${className}`}
    >
      <ModeDial
        modes={transponderDialModes}
        currentModeIndex={dialModeIndex}
        onModeChanged={handleTransponderDialModeChange}
        disabled={disabled}
        turnedOn={turnedOn}
      />

      <div className="display-panel order-first flex grow flex-col items-center justify-center sm:order-2">
        <TransponderDisplay
          turnedOn={displayOn || turnedOn}
          mode={transponderDialModes[dialModeIndex]}
          frequency={frequency}
          digitSelected={displayDigitSelected}
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
          disabled={disabled}
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

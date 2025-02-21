"use client";

import { type RadioState } from "~/lib/types/simulator";
import ModeDial from "./mode-dial";
import RadioDisplay from "./radio-display";
import DoubleFrequencyDial from "./double-frequency-dial";

type RadioProps = {
  className?: string;
  disabled?: boolean;
  turnedOn?: boolean;
};

const Radio = ({
  className = "",
  disabled = false,
  turnedOn = true,
}: RadioProps) => {
  let RadioDialModes: ArrayMaxLength7MinLength2 = ["OFF", "SBY"];
  type ArrayMaxLength7MinLength2 = readonly [
    string,
    string,
    string?,
    string?,
    string?,
    string?,
    string?,
  ];

  // Holds current radio settings
  let radioState: RadioState = {
    mode: "OFF",
    dialMode: "OFF",
    activeFrequency: "121.800",
    standbyFrequency: "129.800",
    tertiaryFrequency: "177.200",
  };

  let activeFrequency: number = 121.8;
  let standbyFrequency: number = 129.8;
  let tertiaryFrequency: number = 177.2;

  let displayOn: boolean = false;
  let frequencyDialEnabled: boolean = false;
  let transmitButtonEnabled: boolean = false;
  let transmitting: boolean = false;

  // Click handlers
  const handleCOMButtonClick = () => {
    if (radioState.dialMode != "OFF") {
      const COMModeButton = document.getElementById(
        "button-com",
      ) as HTMLInputElement;
      if (COMModeButton != null) {
        if (radioState.mode != "COM") {
          if (radioState.mode === "NAV") {
            const NAVModeButton = document.getElementById(
              "button-nav",
            ) as HTMLInputElement;
            NAVModeButton.classList.remove("active-button");
          }
          radioState.mode = "COM";
          COMModeButton.classList.add("active-button");
        }
      }
    }
  };

  const handleNAVButtonClick = () => {
    if (radioState.dialMode != "OFF") {
      const NAVModeButton = document.getElementById(
        "button-nav",
      ) as HTMLInputElement;
      if (NAVModeButton != null) {
        if (radioState.mode != "NAV") {
          if (radioState.mode === "COM") {
            const COMModeButton = document.getElementById(
              "button-com",
            ) as HTMLInputElement;
            COMModeButton.classList.remove("active-button");
          }
          radioState.mode = "NAV";
          NAVModeButton.classList.add("active-button");
        }
      }
    }
  };

  const handleSWAPButtonClick = () => {
    if (radioState.dialMode != "OFF") {
      let tempFrequency: number = activeFrequency;
      activeFrequency = standbyFrequency;
      standbyFrequency = tempFrequency;

      radioState.activeFrequency = activeFrequency.toFixed(3);
      radioState.standbyFrequency = standbyFrequency.toFixed(3);
    }
  };

  function onDialModeChange(event: Event) {
    // Fix this hack
    var newDialModeIndex = event.detail;
    if (newDialModeIndex == 0) {
      if (radioState.mode === "COM") {
        const COMModeButton = document.getElementById(
          "button-com",
        ) as HTMLInputElement;
        COMModeButton.classList.remove("active-button");
      } else if (radioState.mode === "NAV") {
        const NAVModeButton = document.getElementById(
          "button-nav",
        ) as HTMLInputElement;
        NAVModeButton.classList.remove("active-button");
        radioState.mode = "COM";
      }
      displayOn = false;
      frequencyDialEnabled = false;
      transmitButtonEnabled = false;
    } else {
      const COMModeButton = document.getElementById(
        "button-com",
      ) as HTMLInputElement;
      COMModeButton.classList.add("active-button");
      displayOn = true;
      frequencyDialEnabled = true;
      transmitButtonEnabled = true;
    }

    if (newDialModeIndex == 0) {
      radioState.dialMode = "OFF";
    } else {
      radioState.dialMode = "SBY";
    }

    // Shouldnt need to do this here as we have a reactive statement for this, but it seems to be necessary
    // for the store to update when the dail mode changes
    RadioStateStore.set(radioState);
  }

  function onRadioFrequencyIncreaseLarge() {
    standbyFrequency += 1;
    radioState.standbyFrequency = standbyFrequency.toFixed(3);
  }

  function onRadioFrequencyReduceLarge() {
    standbyFrequency -= 1;
    radioState.standbyFrequency = standbyFrequency.toFixed(3);
  }

  // Precision errors are a problem here
  function onRadioFrequencyIncreaseSmall() {
    standbyFrequency = parseFloat((standbyFrequency + 0.005).toPrecision(6));
    radioState.standbyFrequency = standbyFrequency.toFixed(3);
  }

  function onRadioFrequencyReduceSmall() {
    standbyFrequency = parseFloat((standbyFrequency - 0.005).toPrecision(6));
    radioState.standbyFrequency = standbyFrequency.toFixed(3);
  }

  return (
    <div className="card flex max-w-screen-lg grow flex-row flex-wrap place-content-evenly gap-2 bg-neutral-600 p-3 text-white">
      <ModeDial
        modes={RadioDialModes}
        currentModeIndex={0}
        onModeChanged={onDialModeChange}
      />

      <div className="flex flex-col place-content-end gap-1">
        <div className="flex flex-row place-content-center">
          <TransmitButton
            enabled={transmitButtonEnabled}
            transmitting={transmitting}
          />
        </div>
        <div className="flex flex-row place-content-center">Transmit</div>
      </div>

      <div className="display-panel order-first flex w-full grow flex-col sm:order-2">
        <div className="flex grow flex-row place-content-evenly">
          <div>ACTIVE</div>
          <div>STANDBY</div>
        </div>
        <RadioDisplay
          turnedOn={displayOn}
          mode={radioState.mode}
          activeFrequency={radioState.activeFrequency}
          standbyFrequency={radioState.standbyFrequency}
          tertiaryFrequency={radioState.tertiaryFrequency}
        />
        <div className="display-buttons-container flex grow flex-row place-content-center">
          <button
            className="button"
            id="button-com"
            onClick={handleCOMButtonClick}
          >
            COM
          </button>
          <button
            className="button"
            id="button-swap"
            onClick={handleSWAPButtonClick}
          >
            ⇆
          </button>
          <button
            className="button"
            id="button-nav"
            onClick={handleNAVButtonClick}
          >
            NAV
          </button>
        </div>
      </div>
      <div className="order-5 mx-2 flex flex-row">
        <DoubleFrequencyDial
          turnedOn={frequencyDialEnabled}
          on:dialInnerAntiClockwiseTurn={onRadioFrequencyReduceSmall}
          on:dialInnerClockwiseTurn={onRadioFrequencyIncreaseSmall}
          on:dialOuterAntiClockwiseTurn={onRadioFrequencyReduceLarge}
          on:dialOuterClockwiseTurn={onRadioFrequencyIncreaseLarge}
        />
      </div>
    </div>
  );
};

export default Radio;

// {/* <style lang="postcss">
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
// 		background-color: #afa548;
// 		color: black;
// 	}
// </style> */}

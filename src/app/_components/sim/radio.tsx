"use client";

import ModeDial from "./mode-dial";
import RadioDisplay from "./radio-display";
import DoubleFrequencyDial from "./double-frequency-dial";
import useRadioStore from "~/app/stores/radio-store";
import { type RadioMode } from "~/lib/types/simulator";
import TransmitButton from "./transmit-button";

type RadioProps = {
  className?: string;
  disabled?: boolean;
  onSpeechInput?: (transcript: string) => void;
};

const Radio = ({
  className = "",
  disabled = false,
  onSpeechInput,
}: RadioProps) => {
  const RadioDialModes: ArrayMaxLength7MinLength2 = ["OFF", "SBY"];
  type ArrayMaxLength7MinLength2 = readonly [
    string,
    string,
    string?,
    string?,
    string?,
    string?,
    string?,
  ];

  const {
    mode,
    dialMode,
    activeFrequency,
    standbyFrequency,
    tertiaryFrequency,
  } = useRadioStore((state) => state);
  const setMode = useRadioStore((state) => state.setMode);
  const setDialMode = useRadioStore((state) => state.setDialMode);
  const setActiveFrequency = useRadioStore((state) => state.setActiveFrequency);
  const setStandbyFrequency = useRadioStore(
    (state) => state.setStandbyFrequency,
  );
  const setTertiaryFrequency = useRadioStore(
    (state) => state.setTertiaryFrequency,
  );
  const swapActiveStandbyFrequencies = useRadioStore(
    (state) => state.swapActiveAndStandbyFrequencies,
  );

  let displayOn = false;
  let frequencyDialEnabled = false;
  let transmitButtonEnabled = false;
  // eslint-disable-next-line prefer-const
  let transmitting = false;

  // Click handlers
  const handleCOMButtonClick = () => {
    if (dialMode != "OFF") {
      const COMModeButton = document.getElementById(
        "button-com",
      ) as HTMLInputElement;
      if (COMModeButton != null) {
        if (mode != "COM") {
          if (mode === "NAV") {
            const NAVModeButton = document.getElementById(
              "button-nav",
            ) as HTMLInputElement;
            NAVModeButton.classList.remove("active-button");
          }
          setMode("COM");
          COMModeButton.classList.add("active-button");
        }
      }
    }
  };

  const handleNAVButtonClick = () => {
    if (dialMode != "OFF") {
      const NAVModeButton = document.getElementById(
        "button-nav",
      ) as HTMLInputElement;
      if (NAVModeButton != null) {
        if (mode != "NAV") {
          if (mode === "COM") {
            const COMModeButton = document.getElementById(
              "button-com",
            ) as HTMLInputElement;
            COMModeButton.classList.remove("active-button");
          }
          setMode("NAV");
          NAVModeButton.classList.add("active-button");
        }
      }
    }
  };

  const handleSWAPButtonClick = () => {
    if (dialMode != "OFF") {
      swapActiveStandbyFrequencies();
    }
  };

  function handleDialModeChange(modeIndex: number) {
    if (modeIndex == 0) {
      if (mode === "COM") {
        const COMModeButton = document.getElementById(
          "button-com",
        ) as HTMLInputElement;
        COMModeButton.classList.remove("active-button");
      } else if (mode === "NAV") {
        const NAVModeButton = document.getElementById(
          "button-nav",
        ) as HTMLInputElement;
        NAVModeButton.classList.remove("active-button");
        setMode("COM");
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

    if (modeIndex == 0) {
      setDialMode("OFF");
    } else {
      setDialMode("SBY");
    }
  }

  // Fix all this stuff with a utility method for going from string frequency to number, modify value, and back to string
  function handleRadioFrequencyIncreaseLarge() {
    setStandbyFrequency((parseFloat(standbyFrequency) + 1).toPrecision(6));
  }

  function onRadioFrequencyReduceLarge() {
    setStandbyFrequency((parseFloat(standbyFrequency) - 1).toPrecision(6));
  }

  // Precision errors are a problem here
  function onRadioFrequencyIncreaseSmall() {
    setStandbyFrequency((parseFloat(standbyFrequency) + 0.005).toPrecision(6));
  }

  function onRadioFrequencyReduceSmall() {
    setStandbyFrequency((parseFloat(standbyFrequency) - 0.005).toPrecision(6));
  }

  return (
    <div
      className={`card flex max-w-screen-lg grow flex-row flex-wrap place-content-evenly gap-2 bg-neutral-600 p-3 text-white ${className}`}
    >
      <ModeDial
        disabled={disabled}
        modes={RadioDialModes}
        currentModeIndex={0}
        onModeChanged={handleDialModeChange}
      />

      <div className="flex flex-col place-content-end gap-1">
        <div className="flex flex-row place-content-center">
          <TransmitButton
            disabled={disabled}
            speechEnabled={true}
            onSpeechRecieved={onSpeechInput!}
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
          className="min-w-[200px] max-w-[600px]"
          turnedOn={displayOn || disabled}
          mode={mode as RadioMode}
          activeFrequency={activeFrequency}
          standbyFrequency={standbyFrequency}
          tertiaryFrequency={tertiaryFrequency}
        />
        <div className="display-buttons-container flex grow flex-row place-content-center">
          <button
            className="w-[50px]"
            id="button-com"
            onClick={handleCOMButtonClick}
          >
            COM
          </button>
          <button
            className="w-[50px]"
            id="button-swap"
            onClick={handleSWAPButtonClick}
          >
            ⇆
          </button>
          <button
            className="w-[50px]"
            id="button-nav"
            onClick={handleNAVButtonClick}
          >
            NAV
          </button>
        </div>
      </div>
      <div className="order-5 mx-2 flex flex-row">
        <DoubleFrequencyDial
          disabled={disabled}
          turnedOn={frequencyDialEnabled}
          onInnerAntiClockwiseTurn={onRadioFrequencyReduceSmall}
          onInnerClockwiseTurn={onRadioFrequencyIncreaseSmall}
          onOuterAntiClockwiseTurn={onRadioFrequencyReduceLarge}
          onOuterClockwiseTurn={handleRadioFrequencyIncreaseLarge}
        />
      </div>
    </div>
  );
};

export default Radio;

// {/* <style lang="postcss">
// 	/* Global flag required otherwise .active-button is unused at page load
//     and hence removed by the compiler */
// 	:global(.active-button) {
// 		background-color: #afa548;
// 		color: black;
// 	}
// </style> */}

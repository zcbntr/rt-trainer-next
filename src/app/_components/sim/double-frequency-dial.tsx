import { useEffect, useState } from "react";
import { randomString } from "~/lib/utils";

type DoubleFrequencyDialProps = {
  className?: string;
  disabled?: boolean;
  turnedOn?: boolean;
  initialIntervalDuration?: number;
  minIntervalDuration?: number;
  onInnerClockwiseTurn?: () => void;
  onInnerAntiClockwiseTurn?: () => void;
  onOuterClockwiseTurn?: () => void;
  onOuterAntiClockwiseTurn?: () => void;
};

const DoubleFrequencyDial = ({
  className = "",
  disabled = false,
  turnedOn = true,
  initialIntervalDuration = 250,
  minIntervalDuration = 20,
  onInnerClockwiseTurn,
  onInnerAntiClockwiseTurn,
  onOuterClockwiseTurn,
  onOuterAntiClockwiseTurn,
}: DoubleFrequencyDialProps) => {
  const id: string = randomString(6);
  let interval: NodeJS.Timeout;

  const [intervalDuration, setIntervalDuration] = useState(
    initialIntervalDuration,
  );

  useEffect(() => {
    setIntervalDuration(initialIntervalDuration);
  });

  // Ensures that dial is mounted before modifying its properties
  //   $: if (mounted) {
  //     const dial = document.getElementById(
  //       "double-frequency-dial-outer-" + id,
  //     ) as HTMLDivElement;
  //     if (!disabled) {
  //       dial.classList.add("enabled");
  //     } else {
  //       dial.classList.remove("enabled");
  //     }
  //   }

  // if (disabled && interval) {
  // 	clearInterval(interval);
  // }

  const onDialOuterAntiClockwiseTurn = () => {
    if (onOuterAntiClockwiseTurn) onOuterAntiClockwiseTurn();
  };

  const onDialOuterClockwiseTurn = () => {
    if (onOuterClockwiseTurn) onOuterClockwiseTurn();
  };

  const onDialInnerAntiClockwiseTurn = () => {
    if (onInnerAntiClockwiseTurn) onInnerAntiClockwiseTurn();
  };

  const onDialInnerClockwiseTurn = () => {
    if (onInnerClockwiseTurn) onInnerClockwiseTurn();
  };

  function startIncrementingInnerAntiClockwiseHold() {
    onDialInnerAntiClockwiseTurn();
    interval = setInterval(() => {
      onDialInnerAntiClockwiseTurn();
      updateIntervalDuration(startIncrementingInnerAntiClockwiseHold);
    }, intervalDuration);
  }

  function stopIncrementingInnerAntiClockwiseHold() {
    clearInterval(interval);
    setIntervalDuration(initialIntervalDuration);
  }

  function startIncrementingInnerClockwiseHold() {
    onDialInnerClockwiseTurn();
    interval = setInterval(() => {
      onDialInnerClockwiseTurn();
      updateIntervalDuration(startIncrementingInnerClockwiseHold);
    }, intervalDuration);
  }

  function stopIncrementingInnerClockwiseHold() {
    clearInterval(interval);
    setIntervalDuration(initialIntervalDuration);
  }

  function startIncrementingOuterAntiClockwiseHold() {
    onDialOuterAntiClockwiseTurn();
    interval = setInterval(() => {
      onDialOuterAntiClockwiseTurn();
      updateIntervalDuration(startIncrementingOuterAntiClockwiseHold);
    }, intervalDuration);
  }

  function stopIncrementingOuterAntiClockwiseHold() {
    clearInterval(interval);
    setIntervalDuration(initialIntervalDuration);
  }

  function startIncrementingOuterClockwiseHold() {
    onDialOuterClockwiseTurn();
    interval = setInterval(() => {
      onDialOuterClockwiseTurn();
      updateIntervalDuration(startIncrementingOuterClockwiseHold);
    }, intervalDuration);
  }

  function stopIncrementingOuterClockwiseHold() {
    clearInterval(interval);
    setIntervalDuration(initialIntervalDuration);
  }

  function updateIntervalDuration(incrementMethod: () => void) {
    if (intervalDuration > minIntervalDuration) {
      clearInterval(interval);

      const newIntervalDuration = intervalDuration * 0.9 + 5;
      if (newIntervalDuration < minIntervalDuration) {
        setIntervalDuration(minIntervalDuration);
      } else {
        setIntervalDuration(newIntervalDuration);
      }

      incrementMethod();
    }
  }

  return (
    <div id={id} className={`flex items-center justify-center ${className}`}>
      <div id={`dial-container-${id}`} className="relative">
        <div
          id={`frequency-center-div-${id}`}
          className="absolute left-1/2 top-1/2 m-auto"
        />
        <button
          id={`double-frequency-dial-outer-${id}`}
          disabled={disabled || !turnedOn}
          className="height-[100px] transition-350 flex w-[100px] justify-center rounded-xl border border-white ease-in-out"
        >
          <div className="pointer-events-none absolute left-4 top-[30%] w-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2.97 9.43">
              <g opacity="0.25">
                <path
                  data-name="rad jog left out line"
                  d="M1.65 8.25A11.22 11.22 0 011.48.17"
                  fill="none"
                  stroke="#fff"
                  strokeMiterlimit="10"
                />
                <path
                  data-name="rad jog left out arrow"
                  fill="#fff"
                  d="M2.97 6.45v2.98H0"
                />
              </g>
            </svg>
          </div>
          <div className="pointer-events-none absolute right-4 top-[30%] w-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2.97 9.43">
              <g opacity="0.25">
                <path
                  data-name="rad jog right out arrow"
                  d="M1.54.17a11.25 11.25 0 01-.17 8.09"
                  fill="none"
                  stroke="#fff"
                  strokeMiterlimit="10"
                />
                <path
                  data-name="rad jog right out line"
                  fill="#fff"
                  d="M2.97 9.43H0V6.45"
                />
              </g>
            </svg>
          </div>
          <div
            id={`click-container-${id}`}
            className="absolute left-0 top-0 flex h-full w-full flex-row"
          >
            <div
              className="relative w-1/2"
              aria-label="Outer Dial Anti-Clockwise"
              onMouseDown={startIncrementingOuterAntiClockwiseHold}
              onMouseUp={stopIncrementingOuterAntiClockwiseHold}
              onMouseLeave={stopIncrementingOuterAntiClockwiseHold}
            />
            <div
              className="w-1/2"
              aria-label="Outer Dial Clockwise"
              onMouseDown={startIncrementingOuterClockwiseHold}
              onMouseUp={stopIncrementingOuterClockwiseHold}
              onMouseLeave={stopIncrementingOuterClockwiseHold}
            />
          </div>
          <button
            id={`double-frequency-dial-inner-${id}`}
            disabled={disabled || !turnedOn}
            className="double-frequency-dial-inner absolute flex"
          >
            <div className="pointer-events-none absolute left-4 top-[26%] w-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2.7 5.92">
                <g opacity="0.25">
                  <path
                    data-name="rad jog left in line"
                    d="M1.48 4.85a4.12 4.12 0 01-.81-2.46A4.06 4.06 0 011.26.26"
                    fill="none"
                    stroke="#fff"
                    strokeMiterlimit="10"
                  />
                  <path
                    data-name="rad jog left in arrow"
                    fill="#fff"
                    d="M2.7 3.23v2.69H0"
                  />
                </g>
              </svg>
            </div>
            <div className="pointer-events-none absolute right-4 top-[26%] w-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2.7 5.92">
                <g opacity="0.25">
                  <path
                    data-name="rad jog right in line"
                    d="M1.57.26a4.07 4.07 0 01.6 2.13 4.13 4.13 0 01-.82 2.46"
                    fill="none"
                    stroke="#fff"
                    strokeMiterlimit="10"
                  />
                  <path
                    data-name="rad jog right in line"
                    fill="#fff"
                    d="M2.7 5.92H0V3.23"
                  />
                </g>
              </svg>
            </div>
            <div className="absolute left-0 top-0 flex h-full w-full flex-row">
              <div
                className="relative w-1/2"
                aria-label="Inner Dial Anti-Clockwise"
                onMouseDown={startIncrementingInnerAntiClockwiseHold}
                onMouseUp={stopIncrementingInnerAntiClockwiseHold}
                onMouseLeave={stopIncrementingInnerAntiClockwiseHold}
              />
              <div
                className="relative w-1/2"
                aria-label="Inner Dial Clockwise"
                onMouseDown={startIncrementingInnerClockwiseHold}
                onMouseUp={stopIncrementingInnerClockwiseHold}
                onMouseLeave={stopIncrementingInnerClockwiseHold}
              />
            </div>
          </button>
        </button>
      </div>
    </div>
  );
};

export default DoubleFrequencyDial;

{
  /* <style lang="postcss">
	.double-frequency-dial-outer {
		width: 100px;
		height: 100px;
		border: 2px solid #fff;
		border-radius: 50%;
		transition: all 0.35s ease-in-out 0s;
		justify-content: center;
		display: flex;
	}

	.double-frequency-dial-inner {
		width: 50px;
		height: 50px;
		top: 25%;
		border: 2px solid #fff;
		border-radius: 50%;
		transition: all 0.35s ease-in-out 0s;
		justify-content: center;
		display: flex;
	}

	:global(.enabled) {
		box-shadow: rgb(255, 255, 255) 0px 0px 20px -5px;
	}
</style> */
}

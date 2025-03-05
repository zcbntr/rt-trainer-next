"use client";

import { useEffect, useState } from "react";
import { randomString } from "~/lib/utils";

type FrequencyDialProps = {
  className?: string;
  disabled?: boolean;
  turnedOn?: boolean;
  initialIntervalDuration?: number;
  minIntervalDuration?: number;
  onClockwiseTurn?: () => void;
  onAntiClockwiseTurn?: () => void;
};

const FrequencyDial = ({
  className = "",
  disabled = false,
  turnedOn = true,
  initialIntervalDuration = 250,
  minIntervalDuration = 20,
  onClockwiseTurn,
  onAntiClockwiseTurn,
}: FrequencyDialProps) => {
  let interval: NodeJS.Timeout;
  let mounted = false;
  const dialOnClasses = turnedOn ? "ring" : ""; // Check that this is the correct colour (white)

  const [intervalDuration, setIntervalDuration] = useState(
    initialIntervalDuration,
  );

  useEffect(() => {
    mounted = true;
    setIntervalDuration(initialIntervalDuration);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [mounted]);

  function onAntiClockwiseTick() {
    clearInterval(interval);

    const newIntervalDuration = intervalDuration * 0.9 + 5;
    if (newIntervalDuration < minIntervalDuration) {
      setIntervalDuration(minIntervalDuration);
    } else {
      setIntervalDuration(newIntervalDuration);
    }

    interval = setInterval(onAntiClockwiseTick, intervalDuration);

    if (onAntiClockwiseTurn) onAntiClockwiseTurn();
  }

  function startIncrementingAntiClockwiseHold() {
    setIntervalDuration(initialIntervalDuration);
    interval = setInterval(onAntiClockwiseTick, intervalDuration);

    if (onAntiClockwiseTurn) onAntiClockwiseTurn();
  }

  function stopIncrementingAntiClockwiseHold() {
    clearInterval(interval);
  }

  function onClockwiseTick() {
    clearInterval(interval);

    const newIntervalDuration = intervalDuration * 0.9 + 5;
    if (newIntervalDuration < minIntervalDuration) {
      setIntervalDuration(minIntervalDuration);
    } else {
      setIntervalDuration(newIntervalDuration);
    }

    interval = setInterval(onClockwiseTick, intervalDuration);

    if (onClockwiseTurn) onClockwiseTurn();
  }

  function startIncrementingClockwiseHold() {
    setIntervalDuration(initialIntervalDuration);
    interval = setInterval(onClockwiseTick, intervalDuration);

    if (onClockwiseTurn) onClockwiseTurn();
  }

  function stopIncrementingClockwiseHold() {
    clearInterval(interval);
  }

  return (
    <div className={`flex flex-row ${className}`}>
      <div className="flex flex-col place-content-center">
        <div className="relative">
          <div className="absolute left-1/2 top-1/2 m-auto h-0 w-0 rotate-0" />
          <button
            className={`frequency-dial flex h-20 w-20 rounded-full border-2 ${dialOnClasses} ${disabled ? "disabled" : ""}`}
          >
            <div className="pointer-events-none absolute left-4 top-[30%] w-7">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2.7 6.25">
                <g opacity="0.25">
                  <path
                    data-name="X jog left line"
                    d="M1.52 5.29A6.67 6.67 0 011.05.15"
                    fill="none"
                    stroke="#fff"
                    strokeMiterlimit="10"
                  />
                  <path
                    data-name="X jog left arrow"
                    fill="#fff"
                    d="M2.7 3.55v2.7H0"
                  />
                </g>
              </svg>
            </div>
            <div className="pointer-events-none absolute right-4 top-[30%] w-7">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2.7 6.24">
                <g opacity="0.25">
                  <path
                    data-name="X jog right arrow"
                    d="M1.82.15a6.62 6.62 0 01-.47 5.12"
                    fill="none"
                    stroke="#fff"
                    strokeMiterlimit="10"
                  />
                  <path
                    data-name="X jog right line"
                    fill="#fff"
                    d="M2.7 6.24H0v-2.7"
                  />
                </g>
              </svg>
            </div>
            <div className="w-100 h-100 absolute left-0 top-0 flex h-full w-full flex-row">
              <div
                className="w-100 h-100 z-[3] h-full w-1/2"
                aria-label="Frequency dial anticlockwise turn"
                onMouseDown={startIncrementingAntiClockwiseHold}
                onMouseUp={stopIncrementingAntiClockwiseHold}
                onMouseLeave={stopIncrementingAntiClockwiseHold}
              />
              <div
                className="w-100 h-100 z-[3] h-full w-1/2"
                aria-label="Frequency dial clockwise turn"
                onMouseDown={startIncrementingClockwiseHold}
                onMouseUp={stopIncrementingClockwiseHold}
                onMouseLeave={stopIncrementingClockwiseHold}
              />
            </div>

            <div className="center absolute h-10 w-0.5 bg-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrequencyDial;

{
  /* <style lang="postcss">
	.frequency-dial {
		transition: all 0.35s ease-in-out 0s;
		justify-content: center;
		box-shadow: rgb(255, 255, 255) 0px 0px 20px -5px;
	}

	:global(.enabled) {
		box-shadow: rgb(255, 255, 255) 0px 0px 20px -5px;
	}
</style> */
}

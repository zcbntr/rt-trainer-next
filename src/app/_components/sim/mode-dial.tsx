"use client";

import { useEffect, useMemo, useRef } from "react";

// Used to limit number of modes so that the dial doesn't get too crowded
export type ArrayMaxLength7MinLength2 = readonly [
  string,
  string,
  string?,
  string?,
  string?,
  string?,
  string?,
];

type ModeDialProps = {
  className?: string;
  disabled?: boolean;
  modes: ArrayMaxLength7MinLength2;
  turnedOn?: boolean;
  currentMode?: string;
  onModeChanged?: (mode: string) => void;
};

const ModeDial = ({
  className = "",
  disabled = false,
  modes,
  turnedOn = true,
  currentMode = modes[0],
  onModeChanged,
}: ModeDialProps) => {
  const width: string = modes.length > 2 ? "w-56" : "w-56 -mr-6";
  const offRotation = -140;

  const modesMultiplier = Math.round(330 / modes.length);
  let modeDialRingClass = "";

  const modeDialRef = useRef<HTMLDivElement>(null);
  const modeCenterDivRef = useRef<HTMLDivElement>(null);

  const handleDialClick = () => {
    if (disabled) return;

    if (modeDialRef != null) {
      /* If there are only two modes no need to check the side of dial to 
            / determine rotation direction */
      if (modes.length == 2 && onModeChanged) {
        onModeChanged(currentMode == modes[0] ? modes[1] : modes[0]);
      }

      // Otherwise the clickable divs either side of the dial line will handle rotation and we simply return
      return;
    }
  };

  // Finds the mode that was clicked and calls the onModeChanged callback
  const handleModeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const tgt = event.target as HTMLDivElement;
    const mode = tgt.id.split("-")[1];

    if (mode) {
      if (onModeChanged) {
        onModeChanged(mode);
      }
    }
  };

  const incrementMode = () => {
    if (onModeChanged) {
      const modeIndex = modes.findIndex((x) => x == currentMode);
      const nextModeIndex =
        modeIndex == modes.length - 1 ? modeIndex : modeIndex + 1;
      onModeChanged(modes[nextModeIndex]!);
    }
  };

  const decrementMode = () => {
    if (onModeChanged) {
      const modeIndex = modes.findIndex((x) => x == currentMode);
      const nextModeIndex = modeIndex == 0 ? modeIndex : modeIndex - 1;
      onModeChanged(modes[nextModeIndex]!);
    }
  };

  const modeElements = useMemo(() => {
    let angle = 1.4 * 2 * Math.PI;
    const step = (0.83 * 2 * Math.PI) / modes.length;
    const radius = 65;

    return modes.map((modeName, index) => {
      const x =
        Math.round((radius + modeName!.length) * Math.cos(angle)) -
        modeName!.length * 5;
      const y = Math.round((radius + modeName!.length) * Math.sin(angle)) - 3;
      angle += step;

      return (
        <button
          key={index + modeName!}
          id={`mode-${modeName}`}
          style={{ transform: `translate(${x}px, ${y}px)` }}
          className="absolute"
          onClick={handleModeClick}
        >
          {modeName}
        </button>
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modes]);

  useEffect(() => {
    if (!turnedOn) {
      modeDialRef.current!.style.transform = `rotate(${offRotation}deg)`;
      modeDialRingClass = "";
    } else {
      if (currentMode == modes[0]) {
        modeDialRef.current!.style.transform = `rotate(${offRotation}deg)`;
        modeDialRingClass = "";
      } else {
        const newRotation =
          modes.findIndex((x) => x == currentMode) * modesMultiplier +
          offRotation;
        modeDialRingClass =
          "shadow-md shadow-white inset-shadow-sm inset-shadow-white";
        modeDialRef.current!.style.transform = `rotate(${newRotation}deg)`;
      }
    }
  }, [currentMode, modes, modesMultiplier, offRotation, turnedOn]);

  return (
    <div
      id={`dial-and-modes-container`}
      className={`flex h-[130px] flex-row place-content-center ${width} ${className}`}
    >
      <div
        id={`dial-container`}
        className="relative flex flex-col place-content-center"
      >
        <div ref={modeCenterDivRef} className="absolute left-1/2 top-1/2">
          {modeElements}
        </div>

        <div
          ref={modeDialRef}
          className={`${modeDialRingClass} duration-350 flex h-20 w-20 justify-center rounded-full border-2 ease-in-out`}
          onClick={handleDialClick}
          onKeyDown={handleDialClick}
          aria-label="Mode Dial"
          role="button"
        >
          {modes.length > 2 && (
            <>
              <div className="pointer-events-none absolute left-2 top-[30%] w-3.5">
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
              <div className="pointer-events-none absolute right-2 top-[30%] w-3.5">
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

              <div className="left-0 top-0 flex h-full w-full">
                <div
                  className="h-full w-1/2"
                  aria-label="Decrement Mode"
                  onClick={decrementMode}
                  onKeyDown={decrementMode}
                />

                <div
                  className="h-full w-1/2"
                  aria-label="Increment Mode"
                  onClick={incrementMode}
                  onKeyDown={incrementMode}
                />
              </div>
            </>
          )}
          <div className="center absolute h-10 w-0.5 bg-white" />
        </div>
      </div>
    </div>
  );
};

export default ModeDial;

// <style lang="postcss">
// 	:global(.dial-label) {
// 		position: absolute;
// 		width: 40px;
// 		height: 30px;
// 		text-align: right;
// 		display: flex;
// 		-moz-box-pack: center;
// 		justify-content: center;
// 		-moz-box-align: center;
// 		align-items: center;
// 		transform: translateX(-50%) translateY(-50%);
// 		cursor: pointer;
// 	}

// 	:globa(.mode-dial .enabled) {
// 		box-shadow: rgb(255, 255, 255) 0px 0px 20px -5px;
// 	}
// </style>

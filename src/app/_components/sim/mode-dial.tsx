"use client";

import { useEffect } from "react";
import { randomString } from "~/lib/utils";

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
  currentModeIndex?: number;
  onModeChanged?: (mode: number) => void;
};

const ModeDial = ({
  className = "",
  disabled = false,
  modes,
  turnedOn = false,
  currentModeIndex = 0,
  onModeChanged,
}: ModeDialProps) => {
  const id: string = randomString(6);
  const width: string = modes.length > 2 ? "w-40" : "w-28";
  const dialOnClasses = turnedOn ? "ring" : ""; // Check that this is the correct colour (white)

  const handleDialClick = () => {
    if (disabled) return;

    const ModeDial = document.getElementById(
      "mode-dial-" + id,
    ) as HTMLDivElement;
    if (ModeDial != null) {
      /* If there are only two modes no need to check the side of dial to 
            / determine rotation direction */
      if (modes.length == 2) {
        setMode(currentModeIndex == 0 ? 1 : 0);
      }
      // Otherwise the clickable divs either side of the dial line will handle rotation
    }
  };

  function handleModeClick(event: Event) {
    if (disabled) return;

    const tgt = event.target as HTMLDivElement;
    const mode = tgt.id.split("-")[1];
    const ModeLabel = document.getElementById("mode-" + mode) as HTMLDivElement;
    const ModeDial = document.getElementById(
      "mode-dial-" + id,
    ) as HTMLDivElement;
    if (ModeLabel != null && ModeDial != null) {
      const ModeIndex = modes.indexOf(mode);
      if (ModeIndex > -1 && ModeIndex < modes.length) {
        setMode(ModeIndex);
      }
    }
  }

  const incrementMode = () => {
    if (currentModeIndex != modes.length - 1) {
      setMode(currentModeIndex + 1);
    }
  };

  const decrementMode = () => {
    if (currentModeIndex != 0) {
      setMode(currentModeIndex - 1);
    }
  };

  function addModes() {
    // Add mode clickable labels around dial from -150 to 150 degrees
    const centerDiv = document.getElementById(
      "mode-center-div-" + id,
    ) as HTMLDivElement;
    let angle = 0.33 * Math.PI;
    const step = (0.83 * 2 * Math.PI) / modes.length;
    const radius = 60;
    if (centerDiv != null) {
      for (const mode of modes) {
        if (mode != undefined) {
          addMode(
            mode,
            radius * Math.sin(angle),
            (radius + mode.length) * -Math.cos(angle),
            centerDiv,
          );
          angle -= step;
        }
      }
    }
  }

  // Add mode label to dial at given x and y coordinates
  function addMode(
    mode: string,
    x: number,
    y: number,
    centerDiv: HTMLDivElement,
  ) {
    const ModeDiv = document.createElement("div");
    ModeDiv.setAttribute("style", "top:" + x + "px; left:" + y + "px;");
    ModeDiv.setAttribute("className", "dial-label absolute");
    ModeDiv.setAttribute("id", "mode-" + mode);
    ModeDiv.addEventListener("click", handleModeClick);
    ModeDiv.textContent = mode;
    centerDiv.appendChild(ModeDiv);
  }

  function setMode(modeIndex: number) {
    // goes from -150 to 150
    const modesMultiplier = Math.round(300 / modes.length);
    const ModeDial = document.getElementById(
      "mode-dial-" + id,
    ) as HTMLDivElement;
    if (ModeDial != null) {
      if (modes.length == 2) {
        if (modeIndex == 0) {
          ModeDial.style.transform = "rotate(-150deg)";
          turnedOn = false;
        } else {
          ModeDial.style.transform = "rotate(0deg)";
          turnedOn = true;
        }
      } else {
        if (modeIndex == 0) {
          ModeDial.style.transform = "rotate(-150deg)";
          turnedOn = false;
        } else {
          const newRotation = modeIndex * modesMultiplier - 150;
          ModeDial.style.transform = "rotate(" + newRotation + "deg)";
          turnedOn = true;
        }
      }
    }

    currentModeIndex = modeIndex;
    if (onModeChanged != null) {
      onModeChanged(modeIndex);
    }
  }

  useEffect(() => {
    addModes();
    setMode(currentModeIndex);

    // return () => {};
  });

  return (
    <div
      id={`dial-and-modes-container-' + ${id}`}
      className={`flex h-[130px] flex-row place-content-center ${width} ${className}`}
    >
      <div
        id={`dial-container-${id}`}
        className="relative flex flex-col place-content-center"
      >
        <div
          id={`mode-center-div-${id}`}
          className="absolute left-1/2 top-1/2 m-auto"
        />
        <div
          id={`mode-dial-${id}`}
          className={`duration-350 flex h-20 w-20 rotate-[150deg] justify-center rounded-full border-2 ease-in-out ${dialOnClasses}`}
          onClick={handleDialClick}
          onKeyDown={handleDialClick}
          aria-label="Mode Dial"
          role="button"
        >
          {modes.length > 2 && (
            <>
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

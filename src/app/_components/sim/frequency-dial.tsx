import { randomString } from "~/lib/utils";

type FrequencyDialProps = {
  className?: string;
  disabled?: boolean;
  intervalDuration?: number;
};

const frequencyDial = ({
  className = "",
  disabled = false,
  intervalDuration = 250,
}: FrequencyDialProps) => {
  const id = randomString(6);
  let interval: NodeJS.Timeout;

  const dialClockwiseTurn = new CustomEvent("dialClockwiseTurn", {
    detail: {
      direction: "clockwise",
      dialId: id,
    },
  });

  const dialAntiClockwiseTurn = new CustomEvent("dialAntiClockwiseTurn", {
    detail: {
      direction: "anticlockwise",
      dialId: id,
    },
  });

  // if (disabled && interval) {
  //   clearInterval(interval);
  // }

  function onAntiClockwiseTick() {
    clearInterval(interval);
    intervalDuration = intervalDuration * 0.9 + 5;
    interval = setInterval(onAntiClockwiseTick, intervalDuration);
    document.dispatchEvent(dialAntiClockwiseTurn);
  }

  function startIncrementingAntiClockwiseHold() {
    intervalDuration = 250;
    interval = setInterval(onAntiClockwiseTick, intervalDuration);
    document.dispatchEvent(dialAntiClockwiseTurn);
  }

  function stopIncrementingAntiClockwiseHold() {
    clearInterval(interval);
  }

  function onClockwiseTick() {
    clearInterval(interval);
    intervalDuration = intervalDuration * 0.9 + 5;
    interval = setInterval(onClockwiseTick, intervalDuration);
    document.dispatchEvent(dialClockwiseTurn);
  }

  function startIncrementingClockwiseHold() {
    intervalDuration = 250;
    interval = setInterval(onClockwiseTick, intervalDuration);
    document.dispatchEvent(dialClockwiseTurn);
  }

  function stopIncrementingClockwiseHold() {
    clearInterval(interval);
  }

  return (
    <div className={`flex flex-row ${className}`}>
      <div
        id={`dial-and-frequency-container-${id}`}
        className="flex flex-col place-content-center"
      >
        <div id={`dial-container-${id}`} className="relative">
          <div
            id={`frequency-center-div-${id}`}
            className="absolute left-1/2 top-1/2 m-auto h-0 w-0 rotate-0"
          />
          <button
            id={`frequency-dial-${id}`}
            className={`frequency-dial flex h-20 w-20 rounded-full border-2 ${disabled ? "disabled" : ""}`}
          >
            <div className="pointer-events-none absolute left-4 top-[30%] w-7">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2.7 6.25">
                <g opacity="0.25">
                  <path
                    data-name="X jog left line"
                    d="M1.52 5.29A6.67 6.67 0 011.05.15"
                    fill="none"
                    stroke="#fff"
                    stroke-miterlimit="10"
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
                    stroke-miterlimit="10"
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

export default frequencyDial;

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

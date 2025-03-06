import { type RadioMode } from "~/lib/types/simulator";

type RadioDisplayProps = {
  className?: string;
  turnedOn?: boolean;
  mode: RadioMode;
  activeFrequency?: string;
  standbyFrequency?: string;
  tertiaryFrequency?: string;
};

const RadioDisplay = ({
  className = "",
  turnedOn = false,
  mode = "COM",
  activeFrequency = "000.000",
  standbyFrequency = "000.000",
  tertiaryFrequency = "000.000",
}: RadioDisplayProps) => {
  //   $: showDisplayText = DisplayOn ? "displayon" : "displayoff";

  return (
    <div
      className={`radio-segdisplay {showDisplayText} flex min-h-[82px] w-full flex-row items-center rounded-sm border bg-gray-900 p-3 ${className}`}
    >
      <div className="ml-2 flex flex-col place-content-center font-mono sm:ml-4 sm:text-lg md:text-2xl/6">
        {mode}
      </div>
      <div className="ml-4 flex flex-col gap-2">
        <div className="sevenSEG flex flex-row flex-wrap sm:ml-8 sm:mr-10">
          <div className="flex flex-row">
            <div className="rdigit font-mono text-[23px] sm:text-lg md:text-3xl/6">
              {activeFrequency}
            </div>
          </div>
          <div>
            <div className="divider-pipe mx-2 font-mono text-[23px] sm:mx-8 sm:text-lg md:text-3xl/6">
              |
            </div>
          </div>
          <div className="flex flex-row">
            <div className="rdigit font-mono text-[23px] sm:text-lg md:text-3xl/6">
              {standbyFrequency}
            </div>
          </div>
        </div>
        <div className="flex flex-row">
          <div className="rdigit font-mono text-[23px] sm:ml-8 sm:text-lg md:text-3xl/6">
            {tertiaryFrequency}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadioDisplay;

{
  /* <style lang="postcss">
	.radio-segdisplay {
		border-style: solid;
		border-color: white;
		border-width: 1px;
		width: 100%;
		height: 90px;
		transition: all 0.4 ease-in-out 0s;
		background: rgba(var(--color-surface-900) / 1);
	}

	:global(.displayon) {
		color: #f74;
		text-shadow: 0 0 7px #f07c0765, 0 0 10px #f07c0765, 0 0 21px #f07c0765, 0 0 32px #f74;
	}

	:global(.displayoff) {
		color: rgba(var(--color-surface-900) / 1);
		text-shadow: none;
	}

	.radio-segdisplay .mode-icon {
		font-family: DSEG7ClassicMini;
		font-size: 23px;
		text-align: left;
		padding: 2px;
	}

	.radio-segdisplay .rdigit {
		font-family: DSEG7ClassicMini;
		text-align: right;
		padding: 8px 0px;
	}

	.radio-segdisplay .divider-pipe {
		text-align: right;
		padding: 8px 0px;
	}
</style> */
}

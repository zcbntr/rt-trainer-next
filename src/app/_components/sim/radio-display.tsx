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
  //   $: if (!DisplayOn) {
  //     mode = "COM";
  //   }

  return (
    <div
      className={`radio-segdisplay {showDisplayText} card flex flex-row place-content-evenly items-center ${className}`}
    >
      <div className="ml-2 flex flex-col place-content-center sm:ml-4">
        <div className="mode-icon">{mode}</div>
      </div>
      <div className="sevenSEG flex flex-row flex-wrap sm:ml-8 sm:mr-10">
        <div className="flex flex-row">
          <div className="rdigit sm:text-md text-[23px] md:text-3xl/6">
            {activeFrequency}
          </div>
        </div>
        <div>
          <div className="divider-pipe sm:text-md mx-2 text-[23px] sm:mx-8 md:text-3xl/6">
            |
          </div>
        </div>
        <div className="flex flex-row">
          <div className="rdigit sm:text-md text-[23px] md:text-3xl/6">
            {standbyFrequency}
          </div>
        </div>
        <div className="flex flex-row">
          <div className="rdigit sm:text-md text-[23px] md:text-3xl/6">
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

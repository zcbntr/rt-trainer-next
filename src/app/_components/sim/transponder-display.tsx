import { useEffect } from "react";
import { type TransponderDialMode } from "~/lib/types/simulator";

type TransponderDisplayProps = {
  className?: string;
  turnedOn?: boolean;
  mode: TransponderDialMode;
  digitSelected?: number;
  frequency: string;
};

const TransponderDisplay = ({
  className = "",
  turnedOn = true,
  mode,
  digitSelected = 0,
  frequency,
}: TransponderDisplayProps) => {
  //   $: showDisplayText = DisplayOn ? "displayon" : "displayoff";

  useEffect(() => {
    const oldSelectedDigit = document.querySelector(".tselected");
    if (oldSelectedDigit != null) {
      oldSelectedDigit.classList.remove("tselected");
    }
    const newSelectedDigit = document.getElementById(
      "tdigit-" + digitSelected,
    ) as HTMLDivElement;
    if (newSelectedDigit != null) {
      newSelectedDigit.classList.add("tselected");
    }
  });

  return (
    <div
      className={`transponder-segdisplay {showDisplayText} card nowrap flex flex-row place-content-between items-center ${className}`}
    >
      <div>
        <div className="mode-icon">{mode}</div>
      </div>
      <div className="sevenSEG mr-5 flex flex-row">
        <div id="tdigit-0" className="tdigit tselected">
          {frequency[3]}
        </div>
        <div id="tdigit-1" className="tdigit">
          {frequency[2]}
        </div>
        <div id="tdigit-2" className="tdigit">
          {frequency[1]}
        </div>
        <div id="tdigit-3" className="tdigit">
          {frequency[0]}
        </div>
      </div>
    </div>
  );
};

export default TransponderDisplay;

{
  /* <style lang="postcss">
	.transponder-segdisplay {
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
	}

	.transponder-segdisplay .mode-icon {
		font-family: DSEG7ClassicMini;
		font-size: 20px;
		text-align: left;
		padding: 2px;
		margin-left: 16px;
	}

	.transponder-segdisplay .sevenSEG {
		font-size: 50px;
		opacity: 1;
	}

	.transponder-segdisplay .tdigit {
		font-family: DSEG7ClassicMini;
		text-align: right;
		padding: 8px 0px;
	}

	.transponder-segdisplay .tdigit.tselected {
		text-decoration-line: underline;
	}
</style> */
}

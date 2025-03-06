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
  const hidden = turnedOn ? "" : "hidden";

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
      className={`transponder-segdisplay {showDisplayText} nowrap flex min-h-[82px] w-full flex-row place-content-between items-center rounded-sm border bg-gray-900 p-3 ${className}`}
    >
      <div
        className={`ml-2 flex flex-col place-content-center font-mono sm:ml-4 sm:text-lg md:text-2xl/6 ${hidden}`}
      >
        {mode}
      </div>
      <div className={`mr-5 flex flex-row ${hidden}`}>
        <div id="tdigit-0" className="font-mono sm:text-xl md:text-4xl/6">
          {frequency[3]}
        </div>
        <div id="tdigit-1" className="font-mono sm:text-xl md:text-4xl/6">
          {frequency[2]}
        </div>
        <div id="tdigit-2" className="font-mono sm:text-xl md:text-4xl/6">
          {frequency[1]}
        </div>
        <div id="tdigit-3" className="font-mono sm:text-xl md:text-4xl/6">
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

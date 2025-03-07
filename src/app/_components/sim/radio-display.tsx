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
  turnedOn = true,
  mode = "COM",
  activeFrequency = "000.000",
  standbyFrequency = "000.000",
  tertiaryFrequency = "000.000",
}: RadioDisplayProps) => {
  const hidden = turnedOn ? "" : "hidden";

  if (activeFrequency.length != 7) {
    console.log(activeFrequency);
    throw new Error("Active frequency must be 7 characters long");
  }

  if (standbyFrequency.length != 7) {
    console.log(standbyFrequency);
    throw new Error("Standby frequency must be 7 characters long");
  }

  if (tertiaryFrequency.length != 7) {
    console.log(tertiaryFrequency);
    throw new Error("Tertiary frequency must be 7 characters long");
  }

  return (
    <div
      className={`radio-segdisplay {showDisplayText} flex min-h-[82px] w-full flex-row items-center rounded-sm border bg-gray-900 p-3 ${className}`}
    >
      <div
        className={`ml-0.5 flex flex-col place-content-center font-mono sm:ml-1 sm:text-lg md:text-2xl/6 ${hidden}`}
      >
        {mode}
      </div>
      <div className={`ml-4 flex flex-col gap-2 ${hidden}`}>
        <div className="sevenSEG flex flex-row flex-wrap sm:mx-7">
          <div className="flex flex-row">
            <div className="rdigit font-mono text-[23px] sm:text-lg md:text-2xl/6">
              {activeFrequency}
            </div>
          </div>
          <div>
            <div className="divider-pipe mx-2 font-mono text-[23px] sm:mx-8 sm:text-lg md:text-2xl/6">
              |
            </div>
          </div>
          <div className="flex flex-row">
            <div className="rdigit font-mono text-[23px] sm:text-lg md:text-2xl/6">
              {standbyFrequency}
            </div>
          </div>
        </div>
        <div className="flex flex-row">
          <div className="rdigit font-mono text-[23px] sm:ml-7 sm:text-lg md:text-2xl/6">
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
</style> */
}

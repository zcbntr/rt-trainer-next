"use client";

import { Switch } from "~/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

type MessageOutputBoxProps = {
  className?: string;
  disabled?: boolean;
  message?: string;
  currentContext?: string;
  currentTarget?: string;
  currentTargetFrequency?: string;
  readReceivedCalls?: boolean;
  speechNoiseLevel?: number;
};

const MessageOutputBox = ({
  className = "",
  disabled = false,
  message = "",
  currentContext = "Context for your current point in the scenario will appear here",
  currentTarget = "",
  currentTargetFrequency = "",
  readReceivedCalls = false,
  speechNoiseLevel = 0,
}: MessageOutputBoxProps) => {
  let currentContext: string;

  return (
    <div
      class={`card flex min-h-72 max-w-lg grow grid-cols-1 flex-col gap-1 rounded-md bg-neutral-600 p-1.5 text-white ${className}`}
    >
      <div class="card flex grow flex-col gap-2 justify-self-stretch border-0 bg-neutral-700 px-2 py-1.5">
        <div>{currentContext}</div>
        <div>{message}</div>
      </div>

      <div class="flex flex-row flex-wrap gap-x-1">
        <div class="toggle shrink-0 px-2">
          <div class="flex flex-col py-2">
            <div class="flex flex-row place-content-start gap-2">
              <div class="flex flex-row place-content-start gap-2">
                <Switch
                  id="enabled-audio-messages"
                  name="slider-label"
                  active="bg-primary-500"
                  role="switch"
                  aria-checked={readReceivedCalls}
                  aria-label="Toggle text-to-speech audio messages"
                  onCheckedChange={() => {
                    readReceivedCalls = !readReceivedCalls;
                  }}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>Hover</TooltipTrigger>
                    <TooltipContent>
                      <p>Add to library</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div
                  class="[&>*]:pointer-events-none"
                  use:popup={audioMessagesInfoTooltip}
                >
                  Read Aloud Received Calls
                </div>
                <div
                  class="card variant-filled-secondary z-[3] p-4"
                  data-popup="audioMessagesInfoPopupHover"
                >
                  <p>
                    Audio messages read aloud when you receive a call from ATC
                    or another aircraft.
                  </p>
                  <div class="arrow variant-filled-secondary" />
                </div>
              </div>
              <div class="flex flex-row place-content-start gap-2">
                <Switch
                  id="enabled-audio-messages-noise"
                  name="slider-label"
                  active="bg-primary-500"
                  disabled={!readReceivedCalls}
                  role="switch"
                  aria-checked={speechNoiseLevel > 0}
                  aria-label="Toggle interference noise"
                  onCheckedChange={() => {
                    speechNoiseLevel = speechNoiseLevel === 0 ? 0.1 : 0;
                  }}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>Hover</TooltipTrigger>
                    <TooltipContent>
                      <p>Add to library</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div
                  class="pointer-events-none"
                >
                  Interference Noise
                </div>
                <div
                  class="card variant-filled-secondary z-[3] p-4"
                  data-popup="audioMessagesNoiseInfoPopupHover"
                >
                  <p>
                    Adds static noise to read out calls. <br />
                    Requires Read Aloud Recieved Calls to be enabled.
                  </p>
                  <div class="arrow variant-filled-secondary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

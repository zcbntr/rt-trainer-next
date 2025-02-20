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
  readReceivedCalls?: boolean;
  speechNoise?: boolean;
  speechNoiseLevel?: number;
};

const MessageOutputBox = ({
  className = "",
  disabled = false,
  message = "",
  currentContext = "Context for your current point in the scenario will appear here",
  readReceivedCalls = false,
  speechNoise = false,
  speechNoiseLevel = 0.1,
}: MessageOutputBoxProps) => {
  const enableAudioMessages = new CustomEvent("enableAudioMessages", {
    detail: {
      enabled: true,
    },
  });

  const disableAudioMessages = new CustomEvent("disableAudioMessages", {
    detail: {
      enabled: false,
    },
  });

  const enableAudioMessagesNoise = new CustomEvent("enableAudioMessagesNoise", {
    detail: {
      enabled: true,
    },
  });

  const disableAudioMessagesNoise = new CustomEvent(
    "disableAudioMessagesNoise",
    {
      detail: {
        enabled: false,
      },
    },
  );

  return (
    <div
      className={`card flex min-h-72 max-w-lg grow grid-cols-1 flex-col gap-1 rounded-md bg-neutral-600 p-1.5 text-white ${className}`}
    >
      <div className="card flex grow flex-col gap-2 justify-self-stretch border-0 bg-neutral-700 px-2 py-1.5">
        <div>{currentContext}</div>
        <div>{message}</div>
      </div>

      <div className="flex flex-row flex-wrap gap-x-1">
        <div className="toggle shrink-0 px-2">
          <div className="flex flex-col py-2">
            <div className="flex flex-row place-content-start gap-2">
              <div className="flex flex-row place-content-start gap-2">
                <Switch
                  id="enabled-audio-messages"
                  name="slider-label"
                  disabled={disabled}
                  role="switch"
                  aria-checked={readReceivedCalls}
                  aria-label="Toggle text-to-speech audio messages"
                  onCheckedChange={() => {
                    readReceivedCalls = !readReceivedCalls;
                    document.dispatchEvent(
                      readReceivedCalls
                        ? enableAudioMessages
                        : disableAudioMessages,
                    );
                  }}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="pointer-events-none">
                        Read Aloud Received Calls
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Audio messages read aloud when you receive a call from
                        ATC or another aircraft.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex flex-row place-content-start gap-2">
                <Switch
                  id="enabled-audio-messages-noise"
                  name="slider-label"
                  disabled={disabled}
                  role="switch"
                  aria-checked={speechNoise}
                  aria-label="Toggle interference noise"
                  onCheckedChange={() => {
                    speechNoiseLevel = speechNoise ? speechNoiseLevel : 0;
                    document.dispatchEvent(
                      speechNoise
                        ? enableAudioMessagesNoise
                        : disableAudioMessagesNoise,
                    );
                  }}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="pointer-events-none">
                        Interference Noise
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Adds static noise to read out calls. <br />
                        Requires Read Aloud Recieved Calls to be enabled.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageOutputBox;
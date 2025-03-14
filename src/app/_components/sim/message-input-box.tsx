"use client";

import SpeechRecognitionToggle from "./speech-recognition-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";

type MessageInputBoxProps = {
  className?: string;
  disabled?: boolean;
  speechRecognitionSupported?: boolean;
  message?: string;
  onLiveFeedbackSettingChanged?: (setting: boolean) => void;
  onSpeechInputSettingChanged?: (setting: boolean) => void;
  onMessageSubmitted?: (message: string) => void;
};

const formSchema = z.object({
  message: z
    .string()
    .min(5, {
      message: "Message must be at least 5 characters.",
    })
    .max(200, {
      message: "Message must not be longer than 200 characters.",
    }),
});

const MessageInputBox = ({
  className,
  disabled,
  speechRecognitionSupported = false,
  message,
  onLiveFeedbackSettingChanged,
  onSpeechInputSettingChanged,
  onMessageSubmitted,
}: MessageInputBoxProps) => {
  const speechInput = false;
  let liveFeedback = false;

  let voiceInputTooltipText =
    "Speech recognition is experimental, you may need to correct the recorded text.";
  if (!speechRecognitionSupported) {
    voiceInputTooltipText =
      "Speech recognition is not supported in this browser. Please use a different browser if you would like to use this feature. Google Chrome, Microsoft Edge and Safari are recommended.";
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: message,
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    if (onMessageSubmitted) {
      onMessageSubmitted(data.message);
    }
  }

  const onReset = () => {
    form.reset();
  };

  return (
    <div
      className={`flex h-52 grid-cols-1 flex-col gap-1 rounded-md bg-neutral-600 p-1.5 text-white ${className}`}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex grow">
          <div className="flex h-[198px] w-full flex-col place-content-between gap-1">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="[h-144px] w-full">
                  <FormControl className="h-full w-full">
                    <Textarea
                      className="h-max max-h-36 min-h-[122px] w-full resize-none overflow-auto rounded-md bg-neutral-700"
                      disabled={disabled}
                      placeholder="Enter your radio message here."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="h-min" />
                </FormItem>
              )}
            />

            <div className="flex h-min flex-row flex-wrap place-content-evenly gap-x-1 pb-1 lg:flex-nowrap">
              <div className="flex flex-col py-2">
                <div className="flex flex-row place-content-start gap-2">
                  <Switch
                    id="enable-live-feedback"
                    name="slider-label"
                    role="switch"
                    aria-checked={liveFeedback}
                    aria-label="Toggle live feedback"
                    defaultChecked={liveFeedback}
                    onCheckedChange={() => {
                      liveFeedback = !liveFeedback;
                      if (onLiveFeedbackSettingChanged) {
                        onLiveFeedbackSettingChanged(liveFeedback);
                      }
                    }}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="pointer-events-none flex flex-col place-content-center">
                          Live Feedback
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div>
                          <p>
                            Shows feedback immediately, instead of just at the
                            end of the scenario.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="flex flex-col py-2">
                <div className="flex flex-row place-content-start gap-2">
                  <SpeechRecognitionToggle
                    speechInputSupported={speechRecognitionSupported}
                    onSpeechInputSettingChanged={() => {
                      if (onSpeechInputSettingChanged) {
                        onSpeechInputSettingChanged(!speechInput);
                      }
                    }}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="pointer-events-none flex flex-col place-content-center">
                          Voice Input
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div>
                          <p>{voiceInputTooltipText}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <Button type="submit">Submit</Button>

              <Button onClick={onReset} type="reset">
                Clear
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default MessageInputBox;

import {
  AvatarQuality,
  StreamingEvents,
  VoiceChatTransport,
  VoiceEmotion,
  StartAvatarRequest,
  STTProvider,
  ElevenLabsModel,
  TaskType,
  TaskMode
} from "@heygen/streaming-avatar";
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn, useUnmount } from "ahooks";

import { Button } from "./Button"; 
import { AvatarConfig } from "./AvatarConfig";
import RecordButton from "@/components/RecordButton";
import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";
import { AvatarControls } from "./AvatarSession/AvatarControls";
import { useVoiceChat } from "./logic/useVoiceChat";
import { StreamingAvatarProvider, StreamingAvatarSessionState } from "./logic";
import { useStreamingAvatarContext } from "./logic/context";
import { LoadingIcon } from "./Icons";
import { MessageHistory } from "./AvatarSession/MessageHistory";
import { OpenAIAssistant } from "@/app/lib/openai-assistant";
import { AVATARS } from "@/app/lib/constants"; 

let openaiAssistant: OpenAIAssistant | null = null;


const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.Low,
  avatarName: "d888f58da09648bfb520315b93971945",
  knowledgeId: undefined,
  voice: {
    rate: 1.5,
    emotion: VoiceEmotion.EXCITED,
    model: ElevenLabsModel.eleven_flash_v2_5,
    // model: ElevenLabsModel.eleven_v3,
  },
  // language: "heb",
  language: "en",
  voiceChatTransport: VoiceChatTransport.WEBSOCKET,
  sttSettings: {
    provider: STTProvider.DEEPGRAM,
  },
};

function InteractiveAvatar() {
  const { initAvatar, startAvatar, stopAvatar, sessionState, stream } =
    useStreamingAvatarSession();
  const { startVoiceChat } = useVoiceChat();
  const { avatarRef } = useStreamingAvatarContext();

  const [config, setConfig] = useState<StartAvatarRequest>(DEFAULT_CONFIG);
  const [isAds, setIsAds] = useState(false);
  const mediaStream = useRef<HTMLVideoElement>(null); 
  // const [language, setLanguage] = useState("en-US");
  const [language, setLanguage] = useState("he-IL");
  const appendTranscript = useMemoizedFn(async (text: string) => {

    if (
      sessionState === StreamingAvatarSessionState.CONNECTED &&
      avatarRef.current 
      // &&openaiAssistant
    ) {
      try {
        // Get response from OpenAI Assistant
        // const response = await openaiAssistant.getResponse(text);
        // console.log("OpenAI Response:", response);
         const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });

        const response = await res.json();
        // Send response to avatar
        console.log("response:", response);
        avatarRef.current.speak({ 
          text: response.response, 
          task_type: TaskType.REPEAT, 
          taskMode: TaskMode.SYNC 
        });
        setIsAds(response.relatedquery);
      } catch (error) {
        console.error("Error sending message to avatar:", error);
      }
    }
  });
  
  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      const token = await response.text();

      console.log("Access Token:", token); // Log the token to verify

      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      throw error;
    }
  }


  const startSessionV2 = useMemoizedFn(async (isVoiceChat: boolean) => {
    try {
      setIsAds(false);
      const newToken = await fetchAccessToken();
      const avatar = initAvatar(newToken);
      
      await startAvatar(config);
      
      // Initialize OpenAI Assistant (reads API key from NEXT_PUBLIC_OPENAI_API_KEY env variable)
      // openaiAssistant = new OpenAIAssistant();
      // await openaiAssistant.initialize();
      // const response = await openaiAssistant.getResponse("Hello");
      // console.log(response)
      // avatar.speak({ text: response, task_type: TaskType.REPEAT, taskMode: TaskMode.SYNC }); 


      if (isVoiceChat) {
        await startVoiceChat(true);
      }
    } catch (error) {
      console.error("Error starting avatar session:", error);
    }
  });
  // const startTest = async()=>{
  //     console.log("HI");
  //     openaiAssistant = new OpenAIAssistant();
  //     // await openaiAssistant.initialize();
  //     const response = await openaiAssistant.getResponse("מהי עיר הבירה של ישראל?");
  //     console.log(response);
  // }
  useUnmount(() => {
    stopAvatar();
  });
 

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
      };
    }
  }, [mediaStream, stream]);

  return (
    <div className="w-full h-full">
      <div className="relative w-full h-full">
        {/* Video */}
        {sessionState !== StreamingAvatarSessionState.INACTIVE && (
          <AvatarVideo ref={mediaStream} isAds={isAds} />
        )}

        {/* OVERLAY CONTROLS - Bottom Center */}
        <div className="
            fixed 
            bottom-8 left-1/2 
            -translate-x-1/2
            flex flex-col gap-3 items-center justify-center
            z-30
          "
        >
          {sessionState === StreamingAvatarSessionState.CONNECTED ? (
            <div className="flex flex-col gap-3 items-center">
              <RecordButton
                language={language}
                onTranscript={appendTranscript}
                className=""
              />
            </div>
          ) : sessionState === StreamingAvatarSessionState.INACTIVE ? (
            <div className="flex flex-row gap-4">
              <Button onClick={() => startSessionV2(true)}>Start</Button>
            </div>
          ) : (
            <LoadingIcon />
          )}
        </div>
      </div>
      {sessionState === StreamingAvatarSessionState.CONNECTED && (
        // <MessageHistory />
        <></>
      )}
    </div>
  );
}

export default function InteractiveAvatarWrapper() {
  return (
    <StreamingAvatarProvider basePath={process.env.NEXT_PUBLIC_BASE_API_URL}>
      <InteractiveAvatar />
    </StreamingAvatarProvider>
  );
}

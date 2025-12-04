import React, { forwardRef } from "react";
import { ConnectionQuality } from "@heygen/streaming-avatar";

import { useConnectionQuality } from "../logic/useConnectionQuality";
import { useStreamingAvatarSession } from "../logic/useStreamingAvatarSession";
import { StreamingAvatarSessionState } from "../logic";
import { CloseIcon } from "../Icons";
import { Button } from "../Button";

interface AvatarVideoProps {
  isAds?: boolean;
  adImageUrl?: string;
}

export const AvatarVideo = forwardRef<HTMLVideoElement, AvatarVideoProps>(
  ({ isAds = false, adImageUrl }, ref) => {
    const { sessionState, stopAvatar } = useStreamingAvatarSession();
    const { connectionQuality } = useConnectionQuality();

    const isLoaded = sessionState === StreamingAvatarSessionState.CONNECTED;

    return (
      <>
        {connectionQuality !== ConnectionQuality.UNKNOWN && (
          <div className="absolute top-3 left-3 bg-black text-white rounded-lg px-3 py-2">
            Connection Quality: {connectionQuality}
          </div>
        )}
        {isLoaded && (
          <Button
            className="absolute top-3 right-3 !p-2 bg-zinc-700 bg-opacity-50 z-10"
            onClick={stopAvatar}
          >
            <CloseIcon />
          </Button>
        )}
    
        <video
          ref={ref}
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        >
          <track kind="captions" />
        </video>
        {isAds && (
          <>
          <img
            src={adImageUrl || "/ads.jpg"}
            alt="Advertisement"
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 object-contain"
            style={{
              width: "200px",
              height: "200px",
              objectFit: "contain",
            }}
          />
          <img
            src={adImageUrl || "qr.png"}
            alt="Advertisement"
             className="absolute top-0 left-[calc(50%+115px)] -translate-x-1/2  z-20 object-contain"
            style={{
              width: "50px",
              height: "50px",
              objectFit: "contain",
            }}
          />
          </>
        )}
        {!isLoaded && (
          <div className="w-full h-full flex items-center justify-center absolute top-0 left-0">
            Loading...
          </div>
        )}
      </>
    );
  }
);
AvatarVideo.displayName = "AvatarVideo";

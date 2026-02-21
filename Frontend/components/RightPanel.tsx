/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
<<<<<<< HEAD
=======

import VideoStack from "./VideoStack";
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4

import VideoStack from "./VideoStack";
import type { ConnectionState } from "@/hooks/useWebRTC";

interface RightPanelProps {
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  connectionState: ConnectionState;
  isCameraOn: boolean;
  candidateName: string;
}

export default function RightPanel({
  localVideoRef,
  remoteVideoRef,
  connectionState,
  isCameraOn,
  candidateName,
}: RightPanelProps) {
  return (
    <aside className="h-full">
<<<<<<< HEAD
      <VideoStack
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        connectionState={connectionState}
        isCameraOn={isCameraOn}
        candidateName={candidateName}
      />
=======
      <VideoStack />
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
    </aside>
  );
}
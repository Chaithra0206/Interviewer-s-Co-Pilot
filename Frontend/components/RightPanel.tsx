/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import VideoStack from "./VideoStack";


interface RightPanelProps {
  JitsiNode: React.ReactNode;
  connectionState: string;
  candidateName: string;
}

export default function RightPanel({
  JitsiNode,
  connectionState,
  candidateName,
}: RightPanelProps) {
  return (
    <aside className="h-full">
      <VideoStack
        JitsiNode={JitsiNode}
        connectionState={connectionState}
        candidateName={candidateName}
      />
    </aside>
  );
}
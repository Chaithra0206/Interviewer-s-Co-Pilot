/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import VideoStack from "./VideoStack";
import IntelligenceFeed from "./IntelligenceFeed";

export default function RightPanel() {
  return (
    <aside className="h-full flex flex-col gap-4 relative">
      <div className="flex-1 min-h-0">
        <IntelligenceFeed />
      </div>
      <div className="h-auto">
        <VideoStack />
      </div>
    </aside>
  );
}

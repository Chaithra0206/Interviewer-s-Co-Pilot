// components/RightPanel.tsx
import VideoStack from "@/components/VideoStack";
import IntelligenceFeed from "@/components/IntelligenceFeed";

export default function RightPanel() {
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Video Stack */}
      <VideoStack />
      
      {/* Intelligence Feed */}
      <IntelligenceFeed />
    </div>
  );
}
import React from "react";
import { Sparkles, HardDrive } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

interface CleanupInsightsCardProps {
  junkSizeStr: string;
  tempSizeStr: string;
  onNavigateTab: (tab: string) => void;
}

export const CleanupInsightsCard: React.FC<CleanupInsightsCardProps> = ({
  junkSizeStr,
  tempSizeStr,
  onNavigateTab,
}) => {
  return (
    <Card variant="default" padding="md" className="space-y-4 relative overflow-hidden">
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Cleanup & Insights</h3>
        <p className="text-[9px] text-slate-500 font-bold mt-0.5">Actionable recommendations</p>
      </div>

      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-400 flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            System Junk:
          </span>
          <span className="font-mono text-slate-200 font-bold">{junkSizeStr}</span>
        </div>
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-400 flex items-center gap-1.5 font-bold">
            <HardDrive className="w-3.5 h-3.5" />
            Temporary Files:
          </span>
          <span className="font-mono text-slate-200 font-bold">{tempSizeStr}</span>
        </div>
      </div>

      <Button
        onClick={() => onNavigateTab("cleanup")}
        variant="primary"
        className="w-full"
      >
        Analyze & Clean Now
      </Button>
    </Card>
  );
};

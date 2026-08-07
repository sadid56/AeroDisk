import React from "react";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className='flex-1 overflow-y-auto p-6 space-y-6 select-none scrollbar-none animate-in fade-in duration-300'>
      
      {/* 2-Column Dashboard Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Volume Arc & Treemap */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Card 1: Volume Details Skeleton */}
          <Card padding="lg" className="flex flex-col md:flex-row items-center gap-8 justify-between">
            {/* SVG Circular Ring Skeleton */}
            <div className="w-32 h-32 flex items-center justify-center shrink-0">
              <Skeleton width={110} height={110} rounded="full" />
            </div>
            
            {/* Metadata Skeleton */}
            <div className="flex-1 space-y-4 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton width={180} height={16} rounded="sm" />
                  <Skeleton width={110} height={10} rounded="sm" />
                </div>
                <Skeleton width={120} height={18} rounded="full" />
              </div>
              
              {/* Progress bar and text */}
              <div className="space-y-2">
                <Skeleton height={8} rounded="full" className="w-full" />
                <div className="flex justify-between">
                  <Skeleton width={80} height={10} rounded="sm" />
                  <Skeleton width={140} height={10} rounded="sm" />
                </div>
              </div>
              
              <Skeleton width={110} height={28} rounded="md" />
            </div>
          </Card>

          {/* Card 2: Top Folders Treemap Skeleton */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border/40 pb-2">
              <Skeleton width={80} height={12} rounded="sm" />
              <Skeleton width={40} height={10} rounded="sm" />
            </div>
            
            {/* Treemap grid skeleton */}
            <div className="grid grid-cols-12 gap-3 h-[220px]">
              {/* Left Column Skeleton */}
              <div className="col-span-4 rounded-2xl bg-slate-900/30 border border-slate-800/40 p-4 flex flex-col justify-center items-center gap-2">
                <Skeleton width={50} height={12} rounded="sm" />
                <Skeleton width={40} height={10} rounded="sm" />
              </div>
              {/* Middle Column Skeleton */}
              <div className="col-span-4 flex flex-col gap-3 h-full">
                <div className="h-[60%] rounded-2xl bg-slate-900/30 border border-slate-800/40 p-4 flex flex-col justify-center items-center gap-2">
                  <Skeleton width={60} height={12} rounded="sm" />
                  <Skeleton width={30} height={10} rounded="sm" />
                </div>
                <div className="h-[40%] flex gap-3">
                  <div className="w-1/2 h-full rounded-2xl bg-slate-900/20 border border-slate-800/20 p-2 flex flex-col justify-center items-center gap-1">
                    <Skeleton width={25} height={10} rounded="sm" />
                    <Skeleton width={20} height={8} rounded="sm" />
                  </div>
                  <div className="w-1/2 h-full rounded-2xl bg-slate-900/20 border border-slate-800/20 p-2 flex flex-col justify-center items-center gap-1">
                    <Skeleton width={25} height={10} rounded="sm" />
                    <Skeleton width={20} height={8} rounded="sm" />
                  </div>
                </div>
              </div>
              {/* Right Column Skeleton */}
              <div className="col-span-4 flex flex-col gap-3 h-full">
                <div className="h-[60%] rounded-2xl bg-slate-900/30 border border-slate-800/40 p-4 flex flex-col justify-center items-center gap-2">
                  <Skeleton width={50} height={12} rounded="sm" />
                  <Skeleton width={30} height={10} rounded="sm" />
                </div>
                <div className="h-[40%] rounded-2xl bg-slate-900/20 border border-slate-800/20 p-2 flex flex-col justify-center items-center gap-1">
                  <Skeleton width={30} height={10} rounded="sm" />
                  <Skeleton width={20} height={8} rounded="sm" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Optimization, Insights, Largest Files Skeleton */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          {/* Card 3: Largest Files Skeleton */}
          <Card padding="none" className="p-3.5 space-y-3 flex flex-col flex-1">
            <Skeleton width={90} height={12} rounded="sm" />
            <div className="space-y-2.5 mt-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-950/20 px-2.5 py-2.5 rounded-xl border border-surface-border/20">
                  <div className="flex items-center gap-2 flex-1">
                    <Skeleton width={14} height={10} rounded="sm" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton width="60%" height={10} rounded="sm" />
                      <Skeleton width="40%" height={8} rounded="sm" />
                    </div>
                  </div>
                  <Skeleton width={45} height={14} rounded="sm" />
                </div>
              ))}
            </div>
          </Card>

          {/* Card 2: Cleanup Insights Skeleton */}
          <Card padding="md" className="space-y-4">
            <div className="space-y-1.5">
              <Skeleton width={110} height={12} rounded="sm" />
              <Skeleton width={140} height={8} rounded="sm" />
            </div>
            
            <div className="space-y-3 py-2">
              <div className="flex justify-between">
                <Skeleton width={70} height={10} rounded="sm" />
                <Skeleton width={40} height={10} rounded="sm" />
              </div>
              <div className="flex justify-between">
                <Skeleton width={90} height={10} rounded="sm" />
                <Skeleton width={40} height={10} rounded="sm" />
              </div>
            </div>

            <Skeleton height={32} rounded="md" className="w-full" />
          </Card>
        </div>

      </div>
    </div>
  );
};

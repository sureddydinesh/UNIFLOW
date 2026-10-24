import React, { useState } from 'react';
import { HabitHeatmapCell } from '../../utils/habitCalculations';

interface HabitHeatmapProps {
  data: HabitHeatmapCell[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({
  data,
  selectedDate,
  onSelectDate,
}) => {
  const [hoveredCell, setHoveredCell] = useState<HabitHeatmapCell | null>(null);

  // Group cells into 7 rows (Sunday=0 to Saturday=6)
  // Each column is one week
  const columns: HabitHeatmapCell[][] = [];
  let currentWeek: HabitHeatmapCell[] = [];

  data.forEach((cell, idx) => {
    currentWeek.push(cell);
    if (cell.dayOfWeek === 6 || idx === data.length - 1) {
      columns.push(currentWeek);
      currentWeek = [];
    }
  });

  const getCellColor = (intensity: number, isSelected: boolean) => {
    if (isSelected) return 'ring-2 ring-primary scale-110 z-10';

    switch (intensity) {
      case 4:
        return 'bg-primary shadow-sm shadow-primary/30 hover:bg-primary-hover';
      case 3:
        return 'bg-primary/80 hover:bg-primary';
      case 2:
        return 'bg-primary/50 hover:bg-primary/70';
      case 1:
        return 'bg-primary/25 hover:bg-primary/40';
      default:
        return 'bg-border-subtle dark:bg-slate-800/60 hover:bg-elevated border border-border-subtle/50';
    }
  };

  return (
    <div className="card-hover p-5 bg-card rounded-3xl border border-border-subtle shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-main uppercase tracking-wider">
            60-Day Routine Activity Heatmap
          </span>
          <span className="text-[11px] text-text-muted">
            ({data.length} recorded days)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-border-subtle dark:bg-slate-800 border border-border-subtle" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/25" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/50" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/80" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
          <span>More</span>
        </div>
      </div>

      {/* Grid */}
      <div className="relative overflow-x-auto pb-2">
        <div className="flex gap-1.5 min-w-max">
          {/* Day of week labels */}
          <div className="flex flex-col gap-1.5 text-[9px] text-text-muted font-medium pr-1 select-none">
            <span className="h-3 leading-3">Sun</span>
            <span className="h-3 leading-3 opacity-0">Mon</span>
            <span className="h-3 leading-3">Tue</span>
            <span className="h-3 leading-3 opacity-0">Wed</span>
            <span className="h-3 leading-3">Thu</span>
            <span className="h-3 leading-3 opacity-0">Fri</span>
            <span className="h-3 leading-3">Sat</span>
          </div>

          {/* Week Columns */}
          {columns.map((week, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1.5">
              {/* Fill offset for first week if it didn't start on Sunday */}
              {colIdx === 0 && Array.from({ length: week[0].dayOfWeek }).map((_, emptyIdx) => (
                <div key={`empty-${emptyIdx}`} className="w-3.5 h-3.5" />
              ))}

              {week.map((cell) => {
                const isSelected = cell.date === selectedDate;
                return (
                  <button
                    type="button"
                    key={cell.date}
                    onClick={() => onSelectDate(cell.date)}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    aria-label={`Date: ${cell.date}, Completed: ${cell.completedCount} of ${cell.scheduledCount}`}
                    className={`w-3.5 h-3.5 rounded-sm transition-all duration-150 relative ${getCellColor(
                      cell.intensity,
                      isSelected
                    )}`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Hover info banner */}
        <div className="mt-2.5 text-xs text-text-muted min-h-5">
          {hoveredCell ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-main">
                {new Date(hoveredCell.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
                :
              </span>
              <span className="text-primary font-bold">
                {hoveredCell.completedCount} / {hoveredCell.scheduledCount} completed
              </span>
              <span className="text-text-muted">
                ({hoveredCell.completionPercentage}%)
              </span>
              <span className="text-[10px] text-text-muted italic">
                Click to inspect date
              </span>
            </div>
          ) : (
            <span className="text-text-muted text-[11px]">
              Hover over cells to see daily stats, or click to filter today's habits to that date.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  BookOpen, 
  Code, 
  Dumbbell, 
  Droplets, 
  Brain, 
  Moon, 
  Flame, 
  Target, 
  Coffee, 
  Heart, 
  Smile, 
  CheckCircle, 
  Zap, 
  Book, 
  GraduationCap,
  Music,
  Sun,
  Pencil,
  LucideProps
} from 'lucide-react';

export const HABIT_AVAILABLE_ICONS: { id: string; label: string; icon: React.FC<LucideProps> }[] = [
  { id: 'BookOpen', label: 'Study / Reading', icon: BookOpen },
  { id: 'Code', label: 'Coding / Tech', icon: Code },
  { id: 'Dumbbell', label: 'Gym / Fitness', icon: Dumbbell },
  { id: 'Droplets', label: 'Hydration', icon: Droplets },
  { id: 'Brain', label: 'Mindfulness', icon: Brain },
  { id: 'Moon', label: 'Sleep Routine', icon: Moon },
  { id: 'Flame', label: 'Discipline / Streak', icon: Flame },
  { id: 'Target', label: 'Goal / Target', icon: Target },
  { id: 'Coffee', label: 'Morning Routine', icon: Coffee },
  { id: 'Heart', label: 'Health / Vitals', icon: Heart },
  { id: 'Smile', label: 'Wellbeing', icon: Smile },
  { id: 'CheckCircle', label: 'General Task', icon: CheckCircle },
  { id: 'Zap', label: 'High Energy', icon: Zap },
  { id: 'Book', label: 'Deep Reading', icon: Book },
  { id: 'GraduationCap', label: 'Academics', icon: GraduationCap },
  { id: 'Music', label: 'Creativity / Focus', icon: Music },
  { id: 'Sun', label: 'Morning Light', icon: Sun },
  { id: 'Pencil', label: 'Journaling', icon: Pencil },
];

export const HABIT_COLORS = [
  '#8B80FF', // UniFlow Primary Violet
  '#38BDF8', // Cyan / Sky
  '#34D399', // Emerald
  '#FBBF24', // Amber
  '#F43F5E', // Rose
  '#EC4899', // Pink
  '#A855F7', // Purple
  '#F97316', // Orange
  '#06B6D4', // Teal
];

export const renderHabitIcon = (iconName: string, props: LucideProps = { className: 'w-5 h-5' }) => {
  const match = HABIT_AVAILABLE_ICONS.find(i => i.id === iconName);
  if (match) {
    const IconComp = match.icon;
    return <IconComp {...props} />;
  }
  return <BookOpen {...props} />;
};

export type Sentiment = 'neutral' | 'happy' | 'crazy';

export interface Knife {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  rotationSpeed: number;
  speed: number;
  type: 'falling' | 'homing' | 'bouncing' | 'expanding' | 'needle';
  size: number;
  color?: string;
  glow?: boolean;
}

export interface DialogueOption {
  text: string;
  value: number; // Increment/decrement amount or just success flag
  isSuccess: boolean;
  response: string;
  reaction: Sentiment;
}

export interface DialogueEvent {
  id: number;
  question: string;
  options: DialogueOption[];
}

export interface ScoreRecord {
  affection: number;
  level: number;
  timeSurvived: number;
  cleared: boolean;
  date: string;
}

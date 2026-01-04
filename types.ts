
export enum LanguageLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  nativeLanguage: string;
  targetLanguage: string;
  xp: number;
  lessonsCompleted: number;
  proficiencyKeyUnlocked: boolean;
}

export interface DialogueTurn {
  speaker: string;
  text: string;
  translation: string;
}

export interface StoryParagraph {
  text: string;
  translation: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: {
    vocabulary: Array<{ word: string; translation: string; pronunciation: string }>;
    phrases: Array<{ phrase: string; translation: string }>;
    dialogue: DialogueTurn[];
    story?: StoryParagraph[]; // New: Lengthy reading section
    culturalNote: string;
  };
  quiz: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
}

export interface Reel {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  creator: {
    name: string;
    avatar: string;
  };
  caption: string;
  likes: number;
  language: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

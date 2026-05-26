import type { LucideIconData } from '@lucide/angular';

export interface JourneyStep {
  year: string;
  title: string;
  desc: string;
  icon: LucideIconData;
  color: string;
}

export interface Badge {
  label: string;
  icon: LucideIconData;
}

export interface Job {
  role: string;
  company: string;
  type: string;
  period: string;
  description: string;
  achievements: string[];
  stack: string[];
  current?: boolean;
}

export interface SkillCategory {
  name: string;
  tag?: string;
  color: string;
  icon: LucideIconData;
  skills: string[];
}

export interface ServiceItem {
  title: string;
  desc: string;
  tags: string[];
  icon: LucideIconData;
  highlight?: boolean;
}

export interface Course {
  period: string;
  degree: string;
  institution: string;
  desc: string;
  color: string;
  icon: LucideIconData;
}

export interface ContactChannel {
  key: 'mail' | 'whatsapp' | 'linkedin' | 'github';
  label: string;
  value: string;
  href: string;
  iconBg: string;
  iconColor: string;
}

export interface NavLink {
  key: string;
  href: string;
}

export interface Lang {
  code: string;
  flag: string;
  label: string;
}

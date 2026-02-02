export interface GlobalConfig {
    projectName: string;
    teams: TeamConfig[];
}

export interface TeamConfig {
    id: string;
    name: string;
    capacity: number;
    members?: Personnel[];
}

export interface Personnel {
    id: string; // ID or student ID
    name: string;
    gender: 'M' | 'F';
    history: string[]; // Past locations
    tags: string[]; // "Driver", "Leader", etc.
    assignedTeamId?: string;
    attributes?: Record<string, any>;
}

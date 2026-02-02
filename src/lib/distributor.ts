import { Personnel, TeamConfig } from '@/types';

interface DistributionResult {
    teams: TeamConfig[];
    unassigned: Personnel[];
    logs: string[];
}

export const distributePersonnel = (
    personnelList: Personnel[],
    teamConfigs: TeamConfig[]
): DistributionResult => {
    // Deep copy to avoid mutating original state
    const unassigned = [...personnelList];
    const teams = teamConfigs.map(t => ({ ...t, members: [] as Personnel[] }));
    const logs: string[] = [];

    // Shuffle personnel for randomness
    shuffleArray(unassigned);
    logs.push(`Started distribution for ${unassigned.length} personnel into ${teams.length} teams.`);

    // Helper to check constraints
    const canAssign = (person: Personnel, teamName: string): boolean => {
        const history = person.history || [];

        // 1. History Count Constraint: No more than 2 visits to same place (except Anseong)
        // "Anseong" check: Normalized to handle casing or slight variations if needed
        if (!teamName.includes('Anseong') && !teamName.includes('안성')) {
            const visits = history.filter(h => h === teamName).length;
            if (visits >= 2) return false;
        }

        // 2. Consecutive Constraint: Avoid Hoil/Boseong if visited immediately prior
        const lastLocation = history.length > 0 ? history[history.length - 1] : null;
        if (lastLocation && (lastLocation.includes('Hoil') || lastLocation.includes('호일') || lastLocation.includes('Boseong') || lastLocation.includes('보성'))) {
            if (lastLocation === teamName) return false;
        }

        return true;
    };

    // Greedy Distribution with Balance Attempt
    // We iterate through available slots

    // Calculate total capacity
    // const totalCapacity = teams.reduce((sum, t) => sum + t.capacity, 0);

    // Sort teams by capacity (optional, but good for filling) - skipping for now to respect order

    // Round-robin or Fill-one-by-one? Round-robin is better for gender balance usually.

    const assignedIds = new Set<string>();

    // Pass 1: Assign ensuring constraints
    // We iterate through teams and try to pick a suitable person for each slot
    // But strictly round-robin is better: Pick a person, find best team.
    // OR: Loop slots vertically.

    // Strategy: Loop through unassigned personnel and place them in the first valid team that isn't full and maintains gender balance if possible.
    // Actually, to ensure fairness and balance, let's try to place them in the team with the lowest current fill rate.

    for (const person of unassigned) {
        // Sort teams by current usage ratio map to find least filled teams
        // Also consider gender balance: if person is Male, prioritize teams with lower Male%

        const possibleTeams = teams
            .filter(t => t.members.length < t.capacity)
            .sort((a, b) => {
                // Primary sort: Fill percentage (asc)
                const fillA = a.members.length / a.capacity;
                const fillB = b.members.length / b.capacity;
                if (fillA !== fillB) return fillA - fillB;

                // Secondary sort: Gender Balance
                // If person is M, prefer team with fewer M
                const mCountA = a.members.filter(m => m.gender === 'M').length;
                const mCountB = b.members.filter(m => m.gender === 'M').length;
                return mCountA - mCountB;
            });

        let assigned = false;
        for (const team of possibleTeams) {
            if (canAssign(person, team.name)) {
                team.members.push({ ...person, assignedTeamId: team.id });
                assignedIds.add(person.id);
                assigned = true;
                break;
            }
        }

        if (!assigned) {
            logs.push(`Could not assign ${person.name} due to constraints.`);
        }
    }

    const remaining = unassigned.filter(p => !assignedIds.has(p.id));

    return {
        teams,
        unassigned: remaining,
        logs
    };
};

function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

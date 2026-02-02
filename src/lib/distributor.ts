import { Personnel, TeamConfig } from '@/types';
import { DistributionRule } from '@/components/features/input/DistributionRules';

interface DistributionResult {
    teams: TeamConfig[];
    unassigned: Personnel[];
    logs: string[];
}

export const distributePersonnel = (
    personnelList: Personnel[],
    teamConfigs: TeamConfig[],
    rules: DistributionRule[] = []
): DistributionResult => {
    // Deep copy
    const allPersonnel = [...personnelList];
    let teams = teamConfigs.map(t => ({ ...t, members: t.members ? [...t.members] : [] })); // Preserve existing members if any (from Agent/Rules)
    const logs: string[] = [];

    // Helper to find value in person (including attributes)
    const getPersonValue = (p: Personnel, col: string): string => {
        if (col === 'gender') return p.gender;
        if (col === 'name') return p.name;
        // Check attributes
        if (p.attributes && p.attributes[col] !== undefined) return String(p.attributes[col]);
        return '';
    };

    // Tracking assigned IDs to avoid double assignment or re-assignment
    const assignedIds = new Set<string>();
    teams.forEach(t => t.members.forEach(m => assignedIds.add(m.id)));

    // PHASE 1: Apply Rules
    rules.forEach((rule, idx) => {
        logs.push(`[Rule ${idx + 1}] Check: ${rule.column} containing '${rule.value}' -> ${rule.type}`);

        // Find matching target personnel who are NOT yet assigned
        const targets = allPersonnel.filter(p => !assignedIds.has(p.id) && getPersonValue(p, rule.column).includes(rule.value || ''));

        if (targets.length === 0) {
            logs.push(`   -> No matching personnel found for rule.`);
            return;
        }

        if (rule.type === 'assign_to_team') {
            const targetTeam = teams.find(t => t.id === rule.targetTeamId);
            if (targetTeam) {
                targets.forEach(p => {
                    if (targetTeam.members.length < targetTeam.capacity) {
                        targetTeam.members.push({ ...p, assignedTeamId: targetTeam.id });
                        assignedIds.add(p.id);
                    } else {
                        logs.push(`   -> Team ${targetTeam.name} full. Skipped ${p.name}.`);
                    }
                });
                logs.push(`   -> Assigned ${targets.length} people to ${targetTeam.name}.`);
            }
        } else if (rule.type === 'distribute_evenly') {
            // Sort teams by current count of THIS specific condition to balance it?
            // Or just round robin.
            // Better: Balance the count of matching attribute.
            logs.push(`   -> Distributing ${targets.length} people evenly.`);

            // Randomize targets first
            shuffleArray(targets);

            targets.forEach(p => {
                // Find team with LOWEST count of people matching this rule
                // AND having capacity
                const bestTeam = teams
                    .filter(t => t.members.length < t.capacity)
                    .sort((a, b) => {
                        const countA = a.members.filter(m => getPersonValue(m, rule.column).includes(rule.value || '')).length;
                        const countB = b.members.filter(m => getPersonValue(m, rule.column).includes(rule.value || '')).length;
                        // Determine fairness
                        if (countA !== countB) return countA - countB;
                        // Secondary: Total fill rate
                        return (a.members.length / a.capacity) - (b.members.length / b.capacity);
                    })[0];

                if (bestTeam) {
                    bestTeam.members.push({ ...p, assignedTeamId: bestTeam.id });
                    assignedIds.add(p.id);
                }
            });
        }
    });

    // PHASE 2: Standard Distribution for Remaining
    const unassigned = allPersonnel.filter(p => !assignedIds.has(p.id));

    // Helper to check constraints (History, etc.)
    const canAssign = (person: Personnel, teamName: string): boolean => {
        const history = person.history || [];

        // 1. History Count Constraint
        if (!teamName.includes('Anseong') && !teamName.includes('안성')) {
            const visits = history.filter(h => h === teamName).length;
            if (visits >= 2) return false;
        }

        // 2. Consecutive Constraint
        const lastLocation = history.length > 0 ? history[history.length - 1] : null;
        if (lastLocation && (lastLocation.includes('Hoil') || lastLocation.includes('호일') || lastLocation.includes('Boseong') || lastLocation.includes('보성'))) {
            if (lastLocation === teamName) return false;
        }

        return true;
    };

    // Shuffle remaining for randomness
    shuffleArray(unassigned);
    logs.push(`Standard distribution for remaining ${unassigned.length} personnel...`);

    // Reuse existing assignedIds or ignore it because we iterate 'unassigned' array which is already filtered?
    // The original logic iterated 'unassigned' (which was ALL personnel).
    // Now 'unassigned' is FILTERED.
    // So we can just iterate it.
    // But inside the loop it adds to 'assignedIds'.
    // We should keep using the SAME set.

    // (Removed redeclaration of assignedIds)

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

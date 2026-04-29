// Decision 4: branch trigger fires once per session, around turn 3.
export function shouldBranch(args: {
  branchReachable: boolean;
  branchUsed: boolean;
  turnIndex: number;
}): boolean {
  if (args.branchUsed) return false;
  if (!args.branchReachable) return false;
  // "Around turn 3" — fire on turn 2 or later (the rehearsed demo sets up
  // the conflict at turn 1 and the branch at turn 2 in 0-indexed terms,
  // displayed as turn 2/3 in the UI).
  return args.turnIndex >= 2;
}

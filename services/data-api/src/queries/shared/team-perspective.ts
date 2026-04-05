type TeamPerspectiveInput = {
  referenceTeamId: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeScore: string | null;
  awayScore: string | null;
};

export type TeamPerspectiveMatch = {
  opponentId: string;
  opponentName: string;
  side: "home" | "away";
  teamScore: string | null;
  opponentScore: string | null;
};

export const buildTeamPerspectiveMatch = (
  input: TeamPerspectiveInput,
): TeamPerspectiveMatch => {
  const isHome = input.homeTeamId === input.referenceTeamId;

  return {
    opponentId: isHome ? input.awayTeamId : input.homeTeamId,
    opponentName: isHome ? input.awayTeamName : input.homeTeamName,
    side: isHome ? "home" : "away",
    teamScore: isHome ? input.homeScore : input.awayScore,
    opponentScore: isHome ? input.awayScore : input.homeScore,
  };
};

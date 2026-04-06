const formatDatePart = (startTime: Date): string =>
  startTime.toISOString().slice(0, 10);

export const buildMatchSlug = ({
  homeTeamSlug,
  awayTeamSlug,
  startTime,
}: {
  homeTeamSlug: string;
  awayTeamSlug: string;
  startTime: Date;
}): string => `${homeTeamSlug}-vs-${awayTeamSlug}-${formatDatePart(startTime)}`;

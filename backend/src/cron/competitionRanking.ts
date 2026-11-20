import { prisma } from '../prisma';

export async function finalizeCompetitions() {
  const now = new Date();

  const competitions = await prisma.competition.findMany({
    where: {
      status: 'active',          // CompetitionStatus.active
      endDate: { lt: now },
    },
  });

  for (const competition of competitions) {
    const participants = await prisma.competitionParticipant.findMany({
      where: { competitionId: competition.id },
      orderBy: [
        { totalStudyMinutes: 'desc' },
        { totalCorrect: 'desc' },
      ],
    });

    // assign ranks
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      await prisma.competitionParticipant.update({
        where: { id: p.id },
        data: { rank: i + 1 },   // ⬅️ قبلاً finalRank بود
      });
    }

    await prisma.competition.update({
      where: { id: competition.id },
      data: { status: 'finished' }, // CompetitionStatus.finished
    });
  }
}

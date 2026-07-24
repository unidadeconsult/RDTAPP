import { z } from "zod";

export const analysisFormSchema = z.object({
  rawText: z.string().min(20, "Cole os dados da partida extraídos do FutOdds."),
  competition: z.string().optional(),
  season: z.string().optional(),
  matchDate: z.string().optional(),
  matchTime: z.string().optional(),
  venue: z.string().optional(),
  homeTeam: z.string().optional(),
  awayTeam: z.string().optional(),
  homePosition: z.string().optional(),
  awayPosition: z.string().optional(),
  oddHome: z.string().optional(),
  oddDraw: z.string().optional(),
  oddAway: z.string().optional(),
  oddOver25: z.string().optional(),
  oddBttsYes: z.string().optional(),
});

export type AnalysisFormValues = z.infer<typeof analysisFormSchema>;

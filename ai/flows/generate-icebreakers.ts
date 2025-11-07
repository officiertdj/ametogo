'use server';
/**
 * @fileOverview A flow to generate icebreaker messages for a new match.
 *
 * - generateIcebreakers - A function that generates conversation starters.
 * - GenerateIcebreakersInput - The input type for the generateIcebreakers function.
 * - GenerateIcebreakersOutput - The return type for the generateIcebreakers function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateIcebreakersInputSchema = z.object({
  currentUserProfile: z.object({
    name: z.string().describe("The current user's name."),
    passions: z.array(z.string()).describe("The current user's passions."),
    bio: z.string().optional().describe("The current user's bio."),
  }),
  matchedUserProfile: z.object({
    name: z.string().describe("The matched user's name."),
    passions: z.array(z.string()).describe("The matched user's passions."),
    bio: z.string().optional().describe("The matched user's bio."),
  }),
});
export type GenerateIcebreakersInput = z.infer<
  typeof GenerateIcebreakersInputSchema
>;

const GenerateIcebreakersOutputSchema = z.object({
  icebreakers: z
    .array(z.string())
    .describe('An array of three unique, engaging, and personalized icebreaker messages.'),
});
export type GenerateIcebreakersOutput = z.infer<
  typeof GenerateIcebreakersOutputSchema
>;

export async function generateIcebreakers(
  input: GenerateIcebreakersInput
): Promise<GenerateIcebreakersOutput> {
  return generateIcebreakersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateIcebreakersPrompt',
  input: { schema: GenerateIcebreakersInputSchema },
  output: { schema: GenerateIcebreakersOutputSchema },
  prompt: `You are a fun, witty, and helpful dating assistant for an app called AméTogo.
Your goal is to help a user, {{currentUserProfile.name}}, start a great conversation with their new match, {{matchedUserProfile.name}}.

Here is the information about the two users:
- Current User ({{currentUserProfile.name}}):
  - Passions: {{#each currentUserProfile.passions}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - Bio: {{{currentUserProfile.bio}}}

- Matched User ({{matchedUserProfile.name}}):
  - Passions: {{#each matchedUserProfile.passions}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  - Bio: {{{matchedUserProfile.bio}}}

Based on their shared passions, or interesting points in their bios, generate three distinct, creative, and personalized icebreaker messages. The tone should be friendly, slightly playful, and encourage a response. Make them short and engaging. Don't use emojis.

Example of good icebreakers:
- "Hey, I saw you're into 'Cuisine'. If you had to create a Togolese fusion dish, what would it be?"
- "Your passion for 'Voyages' caught my eye. What's the most unforgettable place you've ever visited?"
- "I'm also a huge fan of 'Cinéma'. If we were to watch a movie together, would you be on team popcorn or team 'brochettes'?"

Generate exactly three icebreakers.
`,
});

const generateIcebreakersFlow = ai.defineFlow(
  {
    name: 'generateIcebreakersFlow',
    inputSchema: GenerateIcebreakersInputSchema,
    outputSchema: GenerateIcebreakersOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);

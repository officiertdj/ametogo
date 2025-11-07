'use server';

/**
 * @fileOverview A flow to report inappropriate content and have it reviewed by an LLM reasoning tool.
 *
 * - reportInappropriateContent - A function that handles the reporting and reviewing process.
 * - ReportInappropriateContentInput - The input type for the reportInappropriateContent function.
 * - ReportInappropriateContentOutput - The return type for the reportInappropriateContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReportInappropriateContentInputSchema = z.object({
  profileId: z.string().describe('The ID of the profile being reported.'),
  reporterId: z.string().describe('The ID of the user reporting the profile.'),
  reportedContent: z.string().describe('The content being reported (e.g., photo data URI, bio text).'),
  contentType: z.enum(['photo', 'bio']).describe('The type of content being reported.'),
  reportReason: z.string().describe('The reason for reporting the content.'),
});
export type ReportInappropriateContentInput = z.infer<typeof ReportInappropriateContentInputSchema>;

const ReportInappropriateContentOutputSchema = z.object({
  isContentInappropriate: z.boolean().describe('Whether the content is deemed inappropriate by the LLM.'),
  llmReasoning: z.string().describe('The LLM’s reasoning for its determination.'),
});
export type ReportInappropriateContentOutput = z.infer<typeof ReportInappropriateContentOutputSchema>;

export async function reportInappropriateContent(input: ReportInappropriateContentInput): Promise<ReportInappropriateContentOutput> {
  return reportInappropriateContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reportInappropriateContentPrompt',
  input: {schema: ReportInappropriateContentInputSchema},
  output: {schema: ReportInappropriateContentOutputSchema},
  prompt: `You are a content moderator for a dating app called TogoRencontre. You are responsible for reviewing reported content and determining whether it violates the platform’s guidelines.

  A user with ID {{reporterId}} has reported content from profile {{profileId}}. The content type is {{contentType}}, and the reported content is:

  {{#if (eq contentType \"photo\")}}
    Photo: {{media url=reportedContent}}
  {{else}}
    Bio: {{{reportedContent}}}
  {{/if}}

The reason for the report is: {{{reportReason}}}.

Based on this information, determine whether the content is inappropriate according to the following guidelines:

*   Photos should not be sexually explicit, suggestive, or exploit, abuse or endanger children.
*   Bios should not contain hate speech, harassment, or promote violence.

  Output your reasoning and a final determination of whether the content is inappropriate.
`,
});

const reportInappropriateContentFlow = ai.defineFlow(
  {
    name: 'reportInappropriateContentFlow',
    inputSchema: ReportInappropriateContentInputSchema,
    outputSchema: ReportInappropriateContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

'use server';

/**
 * @fileOverview Moderates profile photos for inappropriate content.
 *
 * - moderateProfilePhotos - A function that moderates profile photos.
 * - ModerateProfilePhotosInput - The input type for the moderateProfilePhotos function.
 * - ModerateProfilePhotosOutput - The return type for the moderateProfilePhotos function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateProfilePhotosInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A profile photo as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // keep the single quotes.
    ),
});
export type ModerateProfilePhotosInput = z.infer<
  typeof ModerateProfilePhotosInputSchema
>;

const ModerateProfilePhotosOutputSchema = z.object({
  isSafe: z
    .boolean()
    .describe(
      'Whether the profile photo is safe for display, i.e., does not contain sexually explicit content.'
    ),
  reason: z
    .string()
    .optional()
    .describe('The reason the photo was flagged as unsafe.'),
});
export type ModerateProfilePhotosOutput = z.infer<
  typeof ModerateProfilePhotosOutputSchema
>;

export async function moderateProfilePhotos(
  input: ModerateProfilePhotosInput
): Promise<ModerateProfilePhotosOutput> {
  return moderateProfilePhotosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateProfilePhotosPrompt',
  input: {schema: ModerateProfilePhotosInputSchema},
  output: {schema: ModerateProfilePhotosOutputSchema},
  prompt: `You are an AI content moderator specializing in identifying inappropriate profile pictures for a dating app.

You are provided with a photo of a user profile, and you need to determine if it is safe for display.

Consider the following criteria:
- No sexually explicit content or nudity
- No violent content
- No hateful symbols

If the image violates any of these criteria, set isSafe to false. Otherwise, set it to true.

Photo: {{media url=photoDataUri}}

Output in JSON format.
`,
});

const moderateProfilePhotosFlow = ai.defineFlow(
  {
    name: 'moderateProfilePhotosFlow',
    inputSchema: ModerateProfilePhotosInputSchema,
    outputSchema: ModerateProfilePhotosOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (e: any) {
      console.error('Error moderating photo:', e);
      return {
        isSafe: false,
        reason: 'Error processing image.',
      };
    }
  }
);


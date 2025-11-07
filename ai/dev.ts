'use server';
/**
 * @fileoverview This file is the entrypoint for Genkit's developer UI.
 *
 * It imports all the actions that we want to be able to run from the developer UI.
 * You can bring up the developer UI by running `genkit:dev` script.
 */
import { config } from 'dotenv';
config();

import '@/ai/flows/report-inappropriate-content.ts';
import '@/ai/flows/moderate-profile-photos.ts';
import '@/ai/flows/generate-icebreakers.ts';

import type { GenieWorldData } from '../types/tour.js';

export interface WorldModelAdapter {
  generateWorld(prompt: string, contextImages?: string[]): Promise<GenieWorldData>;
}

export class GenieWorldAdapter implements WorldModelAdapter {
  private readonly vertexProjectId: string | undefined;
  private readonly vertexLocation: string;

  constructor() {
    this.vertexProjectId = process.env.GOOGLE_CLOUD_PROJECT;
    this.vertexLocation = process.env.VERTEX_AI_LOCATION ?? 'us-central1';
  }

  async generateWorld(prompt: string): Promise<GenieWorldData> {
    // Genie 3 is in Google Labs (Project Genie) — no Vertex AI endpoint yet.
    // When it ships, the call will be:
    //   POST https://{location}-aiplatform.googleapis.com/v1/projects/{project}/
    //        locations/{location}/publishers/google/models/genie-3:generateWorld
    //   Authorization: Bearer <gcloud token>
    //   Body: { prompt, outputConfig: { fps: 24, resolution: "720p" } }
    //
    // Until then, return a structured stub so the frontend can render the
    // "coming soon" panel and surface the suggested prompts.

    return {
      available: false,
      session_id: null,
      world_url: null,
      prompt_used: prompt,
      fallback_reason: 'Genie 3 Vertex AI endpoint not yet available — using Google Maps as visual layer.',
      suggested_exploration_prompts: this.buildExplorationPrompts(prompt),
      world_type: 'unavailable',
    };
  }

  private buildExplorationPrompts(basePrompt: string): string[] {
    return [
      `${basePrompt} — morning, golden hour light, light pedestrian traffic`,
      `${basePrompt} — evening, street lights on, restaurants and bars active`,
      `${basePrompt} — rainy day, puddles on sidewalk, people with umbrellas`,
      `${basePrompt} — weekend afternoon, farmers market or street fair`,
      `${basePrompt} — winter, bare trees, quiet streets`,
    ];
  }
}

export function buildGeniePrompt(neighborhoodName: string, city: string, state: string, vibe: string): string {
  return (
    `First-person walking perspective through ${neighborhoodName}, ${city}, ${state}. ` +
    `${vibe} ` +
    `Real-world street-level view: sidewalks, storefronts, people, trees, architecture. ` +
    `Natural lighting, ambient sounds, authentic neighborhood character.`
  );
}

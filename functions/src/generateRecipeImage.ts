import * as functions from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const storage = admin.storage();

type ImageRequest = { recipeId: string; title: string };
export const generateRecipeImage = functions.onCall<ImageRequest>(
  { secrets: ['REPLICATE_API_KEY'], timeoutSeconds: 120 },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new functions.HttpsError('unauthenticated', 'Sign in required');

    const { recipeId, title } = request.data;
    const archiveRef = db.collection('recipeArchive').doc(recipeId);
    const snap = await archiveRef.get();

    if (snap.exists && snap.data()?.imageStatus === 'ready') {
      return { imageUrl: snap.data()!.imageUrl };
    }

    const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY!;
    const prompt = `${title}, professional food photography, natural lighting, shallow depth of field, rustic wooden table, appetizing plating, ultra-realistic, 4k`;

    const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify({ input: { prompt, num_outputs: 1, output_format: 'webp' } }),
    });

    if (!response.ok) {
      await archiveRef.update({ imageStatus: 'failed' });
      throw new functions.HttpsError('internal', 'Image generation failed');
    }

    const result = await response.json() as { output: string | string[] };
    const imageUrl: string = Array.isArray(result.output) ? result.output[0] : result.output;

    const imageResponse = await fetch(imageUrl);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const bucket = storage.bucket();
    const file = bucket.file(`recipeImages/${recipeId}.webp`);
    await file.save(buffer, { metadata: { contentType: 'image/webp' }, public: true });
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/recipeImages/${recipeId}.webp`;

    await archiveRef.update({ imageUrl: publicUrl, imageStatus: 'ready' });
    return { imageUrl: publicUrl };
  }
);

import {sanityClient, useLocalContent} from '../lib/cms/client.ts';
import {dumpQuery} from '../lib/cms/queries.ts';
import {imageFromSanity, type SanityImage} from '../lib/cms/media.ts';
export const dumpImages = [
  { id: 'carton', src: '/images/dump/carton.png', alt: 'An opened, weathered milk carton.', width: 348, height: 714,
    title: 'Personal introduction', description: 'A personal introduction on a milk carton. A portrait, typography and small details turn an everyday piece of packaging into a playful profile.' },
  { id: 'trifold', src: '/images/dump/trifold.png', alt: 'A colorful printed trifold with film stills and a screening program.', width: 847, height: 569,
    title: 'Hudson Film Festival', description: 'Flyer for their 2026 event. A folded program brings together the screening schedule, film stills and festival information, using typography and color to guide the reader through each panel.' },
  { id: 'photograph', src: '/images/dump/photograph.png', alt: 'A decorated food truck with a giant burger on a city street.', width: 1011, height: 502,
    title: 'On the street', description: 'A food truck covered in playful details, photographed on a city street. Oversized food, bright colors and unexpected shapes turn the vehicle into a moving display.' },
  { id: 'truck', src: '/images/dump/truck.png', alt: 'Sketch of a truck.', width: 751, height: 299,
    title: 'Truck sketch', description: 'A side-by-side study of the truck, exploring its silhouette, colors and illustrated details. The drawing brings the different elements together as a single composition.' },
];

export interface DumpImage {id: string; src: string; alt: string; width: number; height: number; title: string; description: string}
export async function getDumpImages(): Promise<DumpImage[]> {
  if (useLocalContent()) return [...dumpImages, ...dumpImages];
  const documents = await sanityClient.fetch<Array<{_id: string; title: string; description: string; displayWidth?: number; image: SanityImage}>>(dumpQuery);
  return documents.map(doc => {
    const image = imageFromSanity(doc.image);
    const width = doc.displayWidth || Math.min(image.width, 1011, 714 * image.width / image.height);
    return {id: doc._id, title: doc.title, description: doc.description, ...image, width, height: width * image.height / image.width};
  });
}

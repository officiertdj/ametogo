import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const placeholderImages: ImagePlaceholder[] = data.placeholderImages;

export function getPlaceholderImage(id: string): ImagePlaceholder | undefined {
  return placeholderImages.find(p => p.id === id);
}

export function getPlaceholderImageByIds(ids: string[]): ImagePlaceholder[] {
    return placeholderImages.filter(p => ids.includes(p.id));
}

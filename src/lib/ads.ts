import data from './ads.json';

export type Ad = {
  id: string;
  sponsor: string;
  imageUrl: string;
  altText: string;
  linkUrl: string;
  imageHint: string;
};

export const ads: Ad[] = data.ads;

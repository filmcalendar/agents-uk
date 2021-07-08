import slugifyRaw from 'slugify';

export default function slugify(input: string): string {
  return slugifyRaw(input, {
    lower: true,
    strict: true,
  });
}

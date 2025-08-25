// Custom Next.js image loader for Supabase Storage with image transformations
// Based on: https://supabase.com/docs/guides/storage/serving/image-transformations#nextjs-loader

const projectId = 'ecbhdotmbwganuwiqyup' // Your Supabase project ID

export default function supabaseLoader({ 
  src, 
  width, 
  quality 
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  return `https://${projectId}.supabase.co/storage/v1/render/image/public/${src}?width=${width}&quality=${quality || 75}`
}
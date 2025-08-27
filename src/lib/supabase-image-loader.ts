// Custom Next.js image loader for Supabase Storage with image transformations
// Based on: https://supabase.com/docs/guides/storage/serving/image-transformations#nextjs-loader

const projectId = "ecbhdotmbwganuwiqyup"; // Your Supabase project ID

export default function supabaseLoader({
  src,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // If src starts with '/', it's a static file from the public folder
  if (src.startsWith('/')) {
    return src;
  }
  
  // Otherwise, it's a Supabase storage file path
  return `https://${projectId}.supabase.co/storage/v1/render/image/public/${src}?quality=${
    quality || 75
  }`;
}

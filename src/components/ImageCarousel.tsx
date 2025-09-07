import InfiniteSlider from "@/components/InfiniteSlider";

interface ImageCarouselProps {
  topRowImages: string[];
  bottomRowImages: string[];
}

export default function ImageCarousel({ topRowImages, bottomRowImages }: ImageCarouselProps) {
  return (
    <div className="space-y-20 md:space-y-12">
      <InfiniteSlider images={topRowImages} speed={30} direction="left" />
      <InfiniteSlider images={bottomRowImages} speed={30} direction="right" />
    </div>
  );
}
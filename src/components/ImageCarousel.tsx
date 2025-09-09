import InfiniteSlider from "@/components/InfiniteSlider";

const topRowImages = [
  "asset_images/gallery-1.png",
  "asset_images/gallery-2.png",
  "asset_images/gallery-3.png",
  "asset_images/gallery-4.png",
  "asset_images/gallery-5.png",
  "asset_images/gallery-6.png",
];

const bottomRowImages = [
  "asset_images/gallery-7.png",
  "asset_images/gallery-8.png",
  "asset_images/gallery-9.png",
  "asset_images/gallery-10.png",
  "asset_images/gallery-11.png",
  "asset_images/gallery-12.png",
];

export default function ImageCarousel() {
  return (
    <div className="space-y-20 md:space-y-12">
      <InfiniteSlider images={topRowImages} speed={30} direction="left" />
      <InfiniteSlider images={bottomRowImages} speed={30} direction="right" />
    </div>
  );
}

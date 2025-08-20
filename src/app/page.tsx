import Image from "next/image";
import InfiniteSlider from "@/components/InfiniteSlider";

export default function Home() {
  const mockHeadshots = [
    "/headshot/mockshot.png",
    "/headshot/mockshot.png",
    "/headshot/mockshot.png",
    "/headshot/mockshot.png",
    "/headshot/mockshot.png",
    "/headshot/mockshot.png",
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Headshots Gallery</h1>
        <InfiniteSlider images={mockHeadshots} speed={30} />
      </div>
    </div>
  );
}

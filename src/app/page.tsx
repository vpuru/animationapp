import Image from "next/image";
import InfiniteSlider from "@/components/InfiniteSlider";
import EndorsementCard from "@/components/EndorsementCard";
import UploadButton from "@/components/UploadButton";

export default function Home() {
  const mockHeadshots = [
    "/photos/ChatGPT Image Aug 20, 2025, 10_34_17 AM.png",
    "/photos/ChatGPT Image Aug 20, 2025, 10_34_19 AM.png",
    "/photos/ChatGPT Image Aug 20, 2025, 10_34_20 AM.png",
    "/photos/ChatGPT Image Aug 20, 2025, 10_34_21 AM.png",
  ];

  return (
    <div
      className="min-h-screen text-gray-900 flex flex-col items-center justify-center"
      style={{ backgroundColor: "#EEF0EB" }}
    >
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-7xl md:text-5xl font-bold mb-2">
            Your World, <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800 bg-clip-text text-transparent animate-gradient-x">
              Animated
            </span>
          </h1>
          {/* <h1 className="text-3xl md:text-5xl font-bold text-black">AI Headshot Generator</h1> */}
          <p className="text-gray-600 text-lg mt-6 max-w-2xl mx-auto">
            Turn you and your friends into animated characters in seconds!
          </p>
        </div>
        <div className="space-y-4 md:space-y-8">
          <InfiniteSlider images={mockHeadshots} speed={30} direction="left" />
          <InfiniteSlider images={mockHeadshots} speed={30} direction="right" />
        </div>
        <div className="my-12">
          <UploadButton />
        </div>
      </div>
    </div>
  );
}

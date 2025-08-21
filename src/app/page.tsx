import Image from "next/image";
import InfiniteSlider from "@/components/InfiniteSlider";
import EndorsementCard from "@/components/EndorsementCard";
import UploadButton from "@/components/UploadButton";
import AnimatedWaveText from "@/components/AnimatedWaveText";
import MyPictures from "@/components/MyPictures";
import TestimonialCard, { TestimonialCardProps } from "@/components/TestimonialCard";
import testimonialsData from "@/data/testimonials.json";

export default function Home() {
  const mockHeadshots = [
    "/photos/ChatGPT Image Aug 20, 2025, 10_34_17 AM.png",
    "/photos/ChatGPT Image Aug 20, 2025, 10_34_19 AM.png",
    "/photos/ChatGPT Image Aug 20, 2025, 10_34_20 AM.png",
    "/photos/ChatGPT Image Aug 20, 2025, 10_34_21 AM.png",
  ];

  return (
    <div className="text-gray-900 overflow-x-hidden">
      <div className="container mx-auto px-4 pt-8 pb-8 flex flex-col items-center">
        <div className="mb-4">
          <MyPictures />
        </div>
        <div className="text-center mb-8 mt-10">
          <h1 className="text-7xl md:text-2xl font-bold mb-2">
            Your World, <br />
            <AnimatedWaveText
              text="Animated"
              className="bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800 bg-clip-text text-transparent animate-gradient-x"
            />
          </h1>
          {/* <h1 className="text-3xl md:text-5xl font-bold text-black">AI Headshot Generator</h1> */}
          <p className="text-gray-600 text-lg mt-6 max-w-2xl mx-auto">
            Couples photos, baby pictures, or even just a selfie - beautifully animated!
          </p>
          <div className="mt-8">
            <UploadButton />
          </div>
        </div>
        <div className="space-y-4 md:space-y-8">
          <InfiniteSlider images={mockHeadshots} speed={30} direction="left" />
          <InfiniteSlider images={mockHeadshots} speed={30} direction="right" />
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonialsData.map((testimonial: TestimonialCardProps, index: number) => (
            <TestimonialCard
              key={index}
              testimonial={testimonial.testimonial}
              userName={testimonial.userName}
              userImage={testimonial.userImage}
              rating={testimonial.rating}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

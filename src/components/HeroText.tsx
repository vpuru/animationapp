export default function HeroText() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="w-full px-8 py-4"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 40%, rgba(255, 255, 255, 0.2) 80%, rgba(255, 255, 255, 0) 100%)",
        }}
      >
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 text-center leading-tight">
          Turn Your Pictures Into
          <br />
          An <span className="text-blue-600">Animation</span>!
        </h1>
      </div>
    </div>
  );
}
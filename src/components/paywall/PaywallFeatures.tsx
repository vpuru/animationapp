import { Sparkles, Clock, Zap, Share2 } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "High-quality animation generation",
    subtitle: "Perfect quality for all your creative projects",
    color: "text-purple-500",
    bgColor: "bg-purple-50"
  },
  {
    icon: Clock,
    title: "Lifetime access",
    subtitle: "Use forever, no subscription needed",
    color: "text-blue-500",
    bgColor: "bg-blue-50"
  },
  {
    icon: Zap,
    title: "Instant delivery",
    subtitle: "No more waiting - it's ready for you!",
    color: "text-green-500",
    bgColor: "bg-green-50"
  },
  {
    icon: Share2,
    title: "Perfect for sharing",
    subtitle: "A magical creation for friends & family",
    color: "text-pink-500",
    bgColor: "bg-pink-50"
  }
];

export default function PaywallFeatures() {
  return (
    <div className="space-y-4 mb-8">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div key={index} className="flex items-start space-x-4">
            <div className={`p-2 rounded-lg ${feature.bgColor}`}>
              <Icon className={`w-5 h-5 ${feature.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
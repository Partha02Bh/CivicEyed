import { BarChart3, Camera, MapPin, Shield, Users, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { motion } from "framer-motion";

// Animation variant for the cards to fade in and move up
const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeInOut" },
  }),
};

const Features = () => {
  
  // Simplified features array, color is now handled by the theme
  const features = [
    {
      icon: Camera,
      title: "Photo Documentation",
      description: "Capture and upload high-quality images of infrastructure issues with automatic metadata tagging.",
    },
    {
      icon: MapPin,
      title: "GPS Location Tracking",
      description: "Precise location capture using GPS coordinates ensures accurate issue positioning and faster response.",
    },
    {
      icon: Users,
      title: "Community Engagement",
      description: "Connect with neighbors, track issue status, and see the impact of your reports on the community.",
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description:
        "Get instant notifications about your reported issues and track resolution progress in real-time.",
    },
    {
      icon: Shield,
      title: "Admin Dashboard",
      description:
        "Comprehensive administrative tools for managing reports, assigning tasks, and monitoring city-wide issues.",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description:
        "Data-driven insights help administrators prioritize resources and track community improvement trends.",
    },
  ];

  return (
    // Section with a very light green background for a subtle, fresh feel
    <section id="features" className="py-20 bg-green-50/70">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-center text-green-900 mb-4">
Why Choose CivicEye?
          </h2>
          <p className="text-xl text-green-700 max-w-2xl mx-auto">
            Everything you need to report, track, and resolve civic issues
            efficiently and effectively.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }} // Animation triggers when 20% of the card is visible
              custom={index} // Stagger the animation for each card
            >
              <Card
                className="
                  bg-white 
                  border border-green-200/80 
                  shadow-md 
                  rounded-xl 
                  h-full 
                  transition-all 
                  duration-300 
                  ease-in-out 
                  hover:shadow-xl 
                  hover:border-green-300 
                  hover:-translate-y-2
                "
              >
                <CardHeader>
                  <div
                    className="
                      w-12 h-12 
                      rounded-lg 
                      bg-green-100 
                      flex 
                      items-center 
                      justify-center 
                      mb-4 
                      transition-transform 
                      duration-300
                    "
                  >
                    {/* Icon with a primary green color */}
                    <feature.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-800">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
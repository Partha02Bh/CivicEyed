import { Camera, MapPin, Send, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const HowItWorks = () => {
  const steps = [
    {
      icon: Camera,
      title: "Capture the Issue",
      description:
        "Take a clear photo of the infrastructure problem using your mobile device or camera.",
    },
    {
      icon: MapPin,
      title: "Add Location Details",
      description:
        "GPS automatically captures the exact location, or manually adjust for precision.",
    },
    {
      icon: Send,
      title: "Submit Your Report",
      description:
        "Add a brief description and submit your report to the appropriate authorities.",
    },
    {
      icon: CheckCircle,
      title: "Track Progress",
      description:
        "Monitor the status of your report and receive updates when action is taken.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* --- Section Header --- */}
        <div className="mb-16 text-center">
          <motion.h2
            className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            How It <span className="text-green-700">Works</span>
          </motion.h2>
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-xl text-slate-600"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Empowering your community, one report at a time. Discover how easy
            it is to make a real difference.
          </motion.p>
        </div>

        {/* --- Steps Grid --- */}
        <div className="relative">
          {/* Decorative connecting line for large screens */}
          <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 transform bg-green-200 lg:block"></div>

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                custom={index}
              >
                {/* THIS IS THE CORRECTED LINE */}
                <div className="relative group h-full flex flex-col rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-green-100">
                  {/* Step Number Badge */}
                  <div className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-lg font-bold text-white shadow-md transition-all duration-300 group-hover:scale-110">
                    {index + 1}
                  </div>

                  {/* Icon Container */}
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700 shadow-inner transition-all duration-300 group-hover:scale-105 group-hover:bg-green-100">
                    <step.icon className="h-8 w-8" />
                  </div>

                  <h3 className="mb-3 text-xl font-bold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="text-base text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
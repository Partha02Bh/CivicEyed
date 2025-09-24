
import { Construction, Trash, TreeDeciduous, Wrench, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";

const issueTypes = [
  {
    icon: Construction,
    title: "Road Infrastructure",
    description:
      "Report potholes, damaged roads, broken sidewalks, and street maintenance issues.",
    image:
      "https://images.unsplash.com/photo-1547399152-f5bbd6a254b8?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    count: 1247,
  },
  {
    icon: Trash,
    title: "Waste Management",
    description:
      "Report illegal dumping, overflowing bins, litter, and garbage collection issues.",
    image:
      "https://plus.unsplash.com/premium_photo-1663076452996-abef3ccfc4f4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    count: 892,
  },
  {
    icon: TreeDeciduous,
    title: "Environmental Issues",
    description:
      "Report damaged trees, fallen branches, landscaping problems, and green space issues.",
    image:
      "https://plus.unsplash.com/premium_photo-1664298311043-46b3814a511f?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y2xpbWF0ZSUyMGNoYW5nZXxlbnwwfHwwfHx8MA%3D%3D",
    count: 534,
  },
  {
    icon: Wrench,
    title: "Utilities & Infrastructure",
    description:
      "Report water leaks, gas issues, electrical problems, and utility infrastructure concerns.",
    image:
      "https://images.unsplash.com/photo-1591645321243-3adc1e75cfdc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGluZnJhc3RydWN0dXJlfGVufDB8fDB8fHww",
    count: 678,
  },
];

const IssueTypes = () => {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            What Can You <span className="text-green-700">Report?</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Our platform covers a wide range of civic issues to help keep your
            community safe and well-maintained.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {issueTypes.map((type, index) => (
            <motion.div
              key={type.title}
              className="group relative flex h-96 flex-col justify-end overflow-hidden rounded-2xl border-2 border-transparent shadow-lg transition-all duration-500 ease-in-out hover:border-green-500/50 hover:shadow-2xl"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
            >
              {/* --- Background Image --- */}
              <img
                src={type.image}
                alt={type.title}
                className="absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
              />
              {/* --- Gradient Overlay --- */}
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

              {/* --- Content --- */}
              <div className="relative z-20 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                    <type.icon className="h-5 w-5 text-green-300" />
                  </div>
                  <h3 className="text-xl font-bold">{type.title}</h3>
                </div>
                {/* --- Hover-Reveal Content --- */}
                <div className="mt-4 space-y-3 opacity-0 transition-all duration-500 ease-in-out group-hover:opacity-100 transform -translate-y-4 group-hover:translate-y-0">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {type.description}
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-200 backdrop-blur-sm">
                    <BarChart2 className="h-3 w-3" />
                    <span>{type.count.toLocaleString()} reports</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IssueTypes;
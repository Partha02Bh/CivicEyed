import { Link } from "react-router-dom";
import { ArrowRight, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button"; // Assuming you still use this
import { handleSupportClick } from "./SupportModel"; // Assuming this is defined
import type { Variants } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface ChoiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  linkTo: string;
  actionText: string;
}
// --- Animation Variants for a polished entrance ---
const variants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const CTA = () => {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid items-center gap-16 lg:grid-cols-2"
          variants={variants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* --- Left Column: The Message --- */}
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Turn Civic Concern into{" "}
              <span className="text-green-700">Action.</span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Our platform empowers you to report issues and see them resolved.
              Join a community dedicated to creating safer, cleaner, and more
              efficient neighborhoods.
            </p>
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Button
                variant="outline"
                onClick={handleSupportClick}
                className="group inline-flex items-center gap-2 rounded-full border-slate-300 px-6 py-3 text-slate-700 transition-all duration-300 hover:border-green-600 hover:bg-green-50"
              >
                <span>Have Questions? Contact Us</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </motion.div>

          {/* --- Right Column: The Choices --- */}
          <motion.div className="space-y-8" variants={itemVariants}>
            {/* Card 1: Citizens */}
            <ChoiceCard
              icon={Users}
              title="For Citizens"
              description="Report an issue, track its progress, and engage with local updates."
              linkTo="/citizen"
              actionText="Start a Report"
            />
            {/* Card 2: Administrators */}
            <ChoiceCard
              icon={Shield}
              title="For Administrators"
              description="Manage reports, coordinate responses, and view city-wide analytics."
              linkTo="/admin"
              actionText="Open Dashboard"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

// --- A dedicated sub-component for the interactive choice cards ---
const ChoiceCard: React.FC<ChoiceCardProps> = ({ icon: Icon, title, description, linkTo, }) => {
  return (
    <Link to={linkTo}>
      <motion.div
        className="group relative flex items-center gap-6 rounded-xl border border-slate-200 bg-slate-50/50 p-6 transition-all duration-300 hover:border-green-300 hover:bg-white hover:shadow-2xl hover:shadow-slate-200"
        whileHover={{ scale: 1.03, y: -5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-md shadow-slate-200/80 transition-all duration-300 group-hover:bg-green-600">
          <Icon className="h-6 w-6 text-green-600 transition-colors duration-300 group-hover:text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <ArrowRight className="h-6 w-6" />
        </div>
      </motion.div>
    </Link>
  );
};

export default CTA;
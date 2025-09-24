import { Mail, Phone, Github, Linkedin, X, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input"; // Assuming you have an Input component from shadcn/ui
import civicIssueLogo from "../assets/civic-issue.png";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { handleSupportClick } from "./SupportModel";

// A reusable, animated link component for the footer, styled for a light theme
interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  isInternal?: boolean;
}

const FooterLink: React.FC<FooterLinkProps> = ({ href, children, isInternal = false }) => {
  const linkContent = (
    <span className="inline-block text-slate-600 transition-all duration-300 group-hover:text-green-700 group-hover:translate-x-1">
      {children}
    </span>
  );

  if (isInternal) {
    return (
      <Link to={href} className="group">
        {linkContent}
      </Link>
    );
  }
  return (
    <a href={href} className="group">
      {linkContent}
    </a>
  );
};

const Footer = () => {
  return (
    // The new white-to-green gradient background
    <footer className="bg-gradient-to-b from-white via-green-50 to-green-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* --- Top Section: Newsletter CTA --- */}
        <div className="grid grid-cols-1 items-center gap-8 rounded-xl bg-white/70 backdrop-blur-md p-8 shadow-lg md:grid-cols-2 lg:p-12">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
Join the Movement
            </h3>
            <p className="mt-2 text-slate-600">
              Stay updated with the latest community reports, success stories,
              and platform updates.
            </p>
          </div>
          <form className="flex w-full gap-2">
            <Input
              type="email"
              placeholder="your.email@example.com"
              className="flex-grow rounded-lg border-slate-300 bg-white/50 text-slate-800 placeholder:text-slate-500 focus:border-green-600 focus:ring-green-600"
            />
            <Button
              type="submit"
              className="flex-shrink-0 rounded-lg bg-green-700 text-white shadow-lg shadow-green-700/20 transition-all duration-300 hover:bg-green-800 hover:shadow-green-700/40"
            >
              <Send className="h-4 w-4" /> Subscribe
              <span className="ml-2 hidden sm:inline">Subscribe</span>
            </Button>
          </form>
        </div>

        {/* --- Middle Section: Main Footer Content --- */}
        <motion.div
          className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {/* Company Info (takes more space) */}
          <motion.div
            className="lg:col-span-2"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <Link to="/" className="inline-flex items-center space-x-3">
              <img
                src={civicIssueLogo}
                alt="CivicIssueReporter Logo"
                className="h-10 w-10"
              />
              <span className="text-xl font-bold text-slate-900">
                CivicIssueReporter
              </span>
            </Link>
            <p className="mt-4 max-w-md text-slate-600">
              A platform dedicated to empowering citizens and improving civic
              infrastructure through collaborative reporting.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <h4 className="font-semibold text-slate-800">Platform</h4>
            <ul className="mt-4 space-y-3">
              <li><FooterLink href="/report-issue" isInternal>Report Issue</FooterLink></li>
              <li><FooterLink href="#">View Reports</FooterLink></li>
              <li><FooterLink href="#how-it-works">How It Works</FooterLink></li>
              <li><FooterLink href="#">Guidelines</FooterLink></li>
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <h4 className="font-semibold text-slate-800">Support</h4>
            <ul className="mt-4 space-y-3">
              <li><a onClick={handleSupportClick} className="group cursor-pointer"><span className="inline-block text-slate-600 transition-all duration-300 group-hover:text-green-700 group-hover:translate-x-1">Contact Us</span></a></li>
              <li><FooterLink href="#">Help Center</FooterLink></li>
              <li><FooterLink href="#">Privacy Policy</FooterLink></li>
              <li><FooterLink href="#">Terms of Service</FooterLink></li>
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <h4 className="font-semibold text-slate-800">Get in Touch</h4>
            <div className="mt-4 space-y-4 text-slate-600">
              <div className="flex items-center gap-3"><Mail className="h-4 w-4 flex-shrink-0 text-slate-400" /><span>support@civicreport.com</span></div>
              <div className="flex items-center gap-3"><Phone className="h-4 w-4 flex-shrink-0 text-slate-400" /><span>+91 0123 456 789</span></div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* --- Bottom Bar: Copyright and Socials --- */}
      <div className="border-t border-slate-200/80">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} CivicIssueReporter. All Rights Reserved.
          </p>
          <div className="flex space-x-2">
            <a href="#" className="rounded-full p-2 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700"><X className="h-4 w-4" /></a>
            <a href="#" className="rounded-full p-2 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700"><Github className="h-4 w-4" /></a>
            <a href="#" className="rounded-full p-2 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700"><Linkedin className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import { ArrowRight, Camera, MapPin, Users } from "lucide-react";
// CORRECTED PATH BELOW
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Hero = () => {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen flex items-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Background theme */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.1),transparent_50%)] -z-1" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.08),transparent_50%)] -z-1" />
      <div
        className="absolute inset-0 -z-1"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <section className="relative w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-slide-in-left">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-green-900/90 leading-tight">
Report Issues,
                  <br />
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Transform
                  </span>
                  <br />
                  Your Community
                </h1>
                <p className="text-xl text-green-700/80 max-w-lg leading-relaxed">
Help build safer, cleaner neighborhoods by reporting
                  infrastructure issues. From potholes to broken streetlights,
                  your voice matters.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to={
                    user?.role === "citizen"
                      ? "/citizen/create-issue"
                      : user?.role === "admin"
                      ? "/"
                      : "/signin"
                  }
                >
                  <Button
                    size="lg"
                    className="relative w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-white flex items-center space-x-2 cursor-pointer 
                    overflow-hidden px-8 py-4 rounded-2xl text-lg shadow-xl 
                    transition-all duration-300 ease-out
                    hover:scale-[1.04] hover:shadow-2xl group"
                  >
                    <span
                      className="absolute inset-0 bg-white/20 translate-x-[-150%] skew-x-12 
                      group-hover:translate-x-[150%] transition-transform duration-700 ease-out"
                    />
                    <Camera className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
                    <span className="relative z-10">Report an Issue</span>
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link
                  to={
                    user?.role === "citizen"
                      ? "/citizen"
                      : user?.role === "admin"
                      ? "/admin"
                      : "/signin"
                  }
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto flex items-center space-x-2 cursor-pointer px-8 py-4 rounded-2xl text-lg
                    bg-white/80 backdrop-blur-md border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                  >
                    <MapPin className="h-5 w-5 text-green-600" />
                    <span>View Reports</span>
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-green-200/80">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">
                    2,847
                  </div>
                  <div className="text-sm text-green-600/90">
                    Issues Resolved
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">
                    15,239
                  </div>
                  <div className="text-sm text-green-600/90">
                    Active Citizens
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">48h</div>
                  <div className="text-sm text-green-600/90">
                    Avg Response
                  </div>
                </div>
              </div>
            </div>

            {/* Right content - Image with hover effects */}
            <div className="relative animate-slide-in-right">
              <div className="relative group rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://static.vecteezy.com/system/resources/previews/023/628/339/non_2x/metropolis-many-tall-buildings-every-building-has-a-different-height-ai-generated-free-png.png"
                  alt="A clean and well-maintained city street"
                  className="w-full h-[550px] object-cover transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)] will-change-transform
                           group-hover:scale-[1.06] group-hover:rotate-[0.6deg] group-hover:brightness-95"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-black/10 opacity-0
                               transition-opacity duration-700 ease-out group-hover:opacity-100"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-12 bg-white/10 blur-md opacity-0
                           transition-opacity duration-700 group-hover:opacity-100 group-hover:animate-hero-shine"
                />

                {/* Floating card: Issue Reported */}
                <div
                  className="absolute top-6 left-6 bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-lg p-4
                           transition-all duration-500 ease-out
                           group-hover:translate-y-1 group-hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_2px_rgba(34,197,94,0.6)]" />
                    <span className="text-sm font-medium text-green-900">
                      Issue Reported
                    </span>
                  </div>
                </div>

                {/* Floating card: Community Active */}
                <div
                  className="absolute bottom-6 right-6 bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-lg p-4
                           transition-all duration-500 ease-out delay-100
                           group-hover:-translate-y-1 group-hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium text-green-900">
                      Community Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Search,
  Plus,
  MapPin,
  Clock,
  User,
  ArrowRight,
  Zap,
  Shield,
  TreePine,
  TrendingUp,
  Heart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { VITE_BACKEND_URL } from "../config/config";
import Player from "lottie-react";
import emptyAnimation from "../assets/animations/empty.json";
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import starloader from "../assets/animations/starloder.json";
import { motion } from "framer-motion";
import { useLoader } from "../contexts/LoaderContext";

interface Issues {
  _id: string;
  title: string;
  description: string;
  type: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  reportedBy: string;
  reportedAt: string;
  image: string;
  status: string;
  hypePoints?: number;
  userHasHyped?: boolean;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  address: string;
}

const MIN_LOADER_DURATION = 2500;
const LOCATION_RADIUS = 1; // km radius to consider as same area

const CitizenHome = () => {
  const [searchCity, setSearchCity] = useState("");
  const [reportedIssues, setReportedIssues] = useState<Issues[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const { hideLoader } = useLoader();

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get user's current location
  const getUserLocation = () => {
    return new Promise<UserLocation>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocode to get address
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_OPENCAGE_API_KEY`
            );
            const data = await response.json();
            const address = data.results?.[0]?.formatted || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            
            resolve({ latitude, longitude, address });
          } catch (error) {
            // Fallback to coordinates if geocoding fails
            resolve({ 
              latitude, 
              longitude, 
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` 
            });
          }
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  useEffect(() => {
    const fetchIssues = async () => {
      const startTime = Date.now();

      try {
        // Get user location first
        const location = await getUserLocation();
        setUserLocation(location);

        const response = await fetch(`${VITE_BACKEND_URL}/api/v1/all-issues`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });

        const data = await response.json();
        if (Array.isArray(data.issues)) {
          // Filter issues by location proximity
          const nearbyIssues = data.issues.filter((issue: Issues) => {
            const distance = calculateDistance(
              location.latitude,
              location.longitude,
              issue.location.latitude,
              issue.location.longitude
            );
            return distance <= LOCATION_RADIUS;
          });

          setReportedIssues(nearbyIssues);
        } else {
          setReportedIssues([]);
        }
      } catch (error) {
        console.error("Error fetching issues:", error);
        // If location fails, fetch all issues as fallback
        try {
          const response = await fetch(`${VITE_BACKEND_URL}/api/v1/all-issues`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          });
          const data = await response.json();
          if (Array.isArray(data.issues)) {
            setReportedIssues(data.issues);
          }
        } catch (fallbackError) {
          console.error("Fallback fetch failed:", fallbackError);
        }
      } finally {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(MIN_LOADER_DURATION - elapsed, 0);

        setTimeout(() => {
          setLoading(false);
          hideLoader();
        }, delay);
      }
    };

    fetchIssues();
  }, [hideLoader]);

  const handleHypeIssue = async (issueId: string) => {
    try {
      const response = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}/hype`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("auth_token")}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReportedIssues(prev => 
          prev.map(issue => 
            issue._id === issueId 
              ? { 
                  ...issue, 
                  hypePoints: data.hypePoints,
                  userHasHyped: data.userHasHyped 
                }
              : issue
          )
        );
      }
    } catch (error) {
      console.error("Error hyping issue:", error);
    }
  };

  const filteredIssues = searchCity
    ? reportedIssues.filter((issue) =>
        issue.location?.address.toLowerCase().includes(searchCity.toLowerCase())
      )
    : reportedIssues;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Rejected":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      case "Pending":
        return "bg-gradient-to-r from-amber-500 to-orange-500 text-white";
      case "Resolved":
        return "bg-gradient-to-r from-emerald-500 to-green-600 text-white";
      case "In Progress":
        return "bg-gradient-to-r from-blue-500 to-indigo-500 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <Player
          autoplay
          loop
          animationData={starloader}
          style={{ height: "200px", width: "200px" }}
        />
        <p className="text-green-600 mt-4 text-lg font-medium">
          Loading community issues...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50"
    >
      {/* Background civic theme */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.08),transparent_50%)]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <HeaderAfterAuth />

      <main className="relative container mx-auto px-6 lg:px-8 py-12 pt-24">
        {/* Hero Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-3xl">
              <Shield className="h-16 w-16 text-green-600" />
            </div>
          </div>

          <h1 className="text-6xl lg:text-7xl font-black bg-gradient-to-r from-green-800 via-emerald-700 to-green-600 bg-clip-text text-transparent mb-6 leading-tight">
            Building Better
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Communities
            </span>
          </h1>
          <p className="text-xl text-green-700/80 max-w-3xl mx-auto mb-8 leading-relaxed">
            Your voice matters in shaping our city. Report issues, track
            progress, and work together to create the community we all deserve
            to call home.
          </p>

          {userLocation && (
            <div className="flex items-center justify-center mb-6 text-green-600/80">
              <MapPin className="h-5 w-5 mr-2" />
              <span>Showing issues near: {userLocation.address}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/citizen/create-issue">
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-10 py-4 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0"
              >
                <Zap className="h-5 w-5 mr-2" />
                Report an Issue
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>

            <Link to="/citizen/profile">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/80 backdrop-blur-md border-green-200 text-green-700 px-10 py-4 text-lg font-semibold rounded-2xl hover:bg-green-50 hover:border-green-300 transition-all duration-300"
              >
                <User className="h-5 w-5 mr-2" />
                My Profile
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-green-500 group-focus-within:text-green-600 transition-colors z-20" />
            <Input
              type="text"
              placeholder="Search by location, district, or neighborhood..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="pl-14 pr-6 py-6 text-lg bg-white/90 backdrop-blur-xl border-green-200 rounded-2xl text-green-800 placeholder:text-green-500/60 focus:bg-white focus:border-green-400 focus:ring-2 focus:ring-green-200 transition-all duration-300 shadow-lg"
            />
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-between mb-12 p-8 bg-white/70 backdrop-blur-xl border border-green-100 rounded-3xl shadow-xl"
        >
          <div>
            <h2 className="text-3xl font-bold text-green-800 mb-2">
              Local Community Issues
              {searchCity && (
                <span className="text-2xl font-normal text-green-600/70 ml-3">
                  in {searchCity}
                </span>
              )}
            </h2>
            <p className="text-green-600/80 flex items-center">
              <TreePine className="h-4 w-4 mr-2" />
              Issues within {LOCATION_RADIUS}km of your area
            </p>
          </div>
          <div className="text-center sm:text-right mt-4 sm:mt-0">
            <div className="text-5xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {filteredIssues.length}
            </div>
            <div className="text-green-600/70 text-sm font-medium">
              Nearby {filteredIssues.length !== 1 ? "Reports" : "Report"}
            </div>
          </div>
        </motion.div>

        {/* Issues Grid */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {filteredIssues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-h-[900px] overflow-y-auto pr-2">
              {filteredIssues.map((issue, index) => (
                <motion.div
                  key={issue._id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                >
                  <Card
                    className={`group relative overflow-hidden bg-white/80 backdrop-blur-xl border-green-100 rounded-3xl hover:bg-white/90 hover:border-green-200 hover:scale-[1.02] hover:shadow-2xl transition-all duration-500 shadow-lg ${
                      issue.status === "Rejected"
                        ? "opacity-50 grayscale"
                        : "opacity-100"
                    }`}
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={issue.image || "/placeholder.jpg"}
                        alt={issue.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div
                        className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(
                          issue.status
                        )} shadow-lg backdrop-blur-sm`}
                      >
                        {issue.status}
                      </div>
                      
                      {/* Hype Points Display */}
                      {issue.hypePoints !== undefined && issue.hypePoints > 0 && (
                        <div className="absolute top-4 left-4 flex items-center bg-red-500/90 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-semibold">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {issue.hypePoints}
                        </div>
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl font-bold text-green-800 group-hover:text-green-700 transition-colors">
                        {issue.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-green-700/80 line-clamp-3 leading-relaxed">
                        {issue.description}
                      </p>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center text-green-600/80">
                          <MapPin className="h-4 w-4 mr-3 text-green-500 flex-shrink-0" />
                          <span className="flex-1">
                            {issue.location.address}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-green-600/80">
                            <User className="h-4 w-4 mr-2 text-green-500" />
                            <span>By {issue.reportedBy}</span>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            {issue.type}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-green-600/80">
                            <Clock className="h-4 w-4 mr-2 text-green-500" />
                            <span>{issue.reportedAt}</span>
                          </div>
                          
                          {/* Hype Button */}
                          <Button
                            onClick={() => handleHypeIssue(issue._id)}
                            variant="outline"
                            size="sm"
                            disabled={issue.userHasHyped}
                            className={`flex items-center space-x-1 transition-all duration-300 ${
                              issue.userHasHyped 
                                ? 'bg-red-50 border-red-200 text-red-600 cursor-not-allowed' 
                                : 'hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                            }`}
                          >
                            <Heart 
                              className={`h-4 w-4 ${
                                issue.userHasHyped ? 'fill-current text-red-500' : ''
                              }`} 
                            />
                            <span className="text-xs font-medium">
                              {issue.userHasHyped ? 'Hyped!' : 'Hype'}
                            </span>
                            {issue.hypePoints !== undefined && issue.hypePoints > 0 && (
                              <span className="text-xs">({issue.hypePoints})</span>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center text-center py-20"
            >
              <div className="max-w-xs mx-auto mb-8">
                <Player
                  autoplay
                  loop
                  animationData={emptyAnimation}
                  style={{ height: "200px", width: "200px" }}
                />
              </div>
              <h3 className="text-3xl font-bold text-green-800 mb-4">
                {searchCity
                  ? `No issues found in ${searchCity}`
                  : "Your Local Area Looks Great!"}
              </h3>
              <p className="text-green-600/80 text-lg mb-8 max-w-md leading-relaxed">
                {searchCity
                  ? "Try searching for a different area or be the first to help improve this neighborhood."
                  : "No active issues in your area right now. Help keep our community thriving by staying vigilant and reporting when needed."}
              </p>
              <Link to="/citizen/create-issue">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-10 py-4 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Report New Issue
                </Button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </main>
    </motion.div>
  );
};

export default CitizenHome;
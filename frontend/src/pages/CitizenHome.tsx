import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
  Eye,
  Flame,
  Calendar,
  Tag,
  Navigation,
  X,
  Megaphone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { VITE_BACKEND_URL } from "../config/config";
import Player from "lottie-react";
import emptyAnimation from "../assets/animations/empty.json";
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import Chatbot from "../components/Chatbot";
import starloader from "../assets/animations/starloder.json";
import { motion } from "framer-motion";
import { useLoader } from "../contexts/LoaderContext";
import { useAnnouncementNotification, markAnnouncementsAsViewed } from "../hooks/useAnnouncementNotification";

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
  const [reportedIssues, setReportedIssues] = useState<Issues[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<Issues | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const { hideLoader } = useLoader();
  const { hasNewAnnouncements, newCount } = useAnnouncementNotification();

  // Fetch issues
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch(`${VITE_BACKEND_URL}/api/v1/issues`);
        const data = await response.json();
        if (data.success) {
          const issues = data.data || [];
          // Sort issues by reportedAt timestamp (most recent first)
          const sortedIssues = issues.sort((a: Issues, b: Issues) => {
            const dateA = new Date(a.reportedAt).getTime();
            const dateB = new Date(b.reportedAt).getTime();
            return dateB - dateA; // Descending order (newest first)
          });
          setReportedIssues(sortedIssues);
        }
      } catch (error) {
        console.error("Error fetching issues:", error);
      } finally {
        setLoading(false);
        hideLoader();
      }
    };

    fetchIssues();
  }, [hideLoader]);


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

          // Sort nearby issues by reportedAt timestamp (most recent first)
          const sortedNearbyIssues = nearbyIssues.sort((a: Issues, b: Issues) => {
            const dateA = new Date(a.reportedAt).getTime();
            const dateB = new Date(b.reportedAt).getTime();
            return dateB - dateA; // Descending order (newest first)
          });

          setReportedIssues(sortedNearbyIssues);
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
            // Sort fallback issues by reportedAt timestamp (most recent first)
            const sortedFallbackIssues = data.issues.sort((a: Issues, b: Issues) => {
              const dateA = new Date(a.reportedAt).getTime();
              const dateB = new Date(b.reportedAt).getTime();
              return dateB - dateA; // Descending order (newest first)
            });
            setReportedIssues(sortedFallbackIssues);
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
    // Optimistic UI update
    setReportedIssues(prev => prev.map(issue => issue._id === issueId 
      ? { ...issue, hypePoints: (issue.hypePoints || 0) + (issue.userHasHyped ? 0 : 1), userHasHyped: true }
      : issue
    ));
    // Sync modal state if open
    setSelectedIssue(prev => prev && prev._id === issueId 
      ? { ...prev, hypePoints: (prev.hypePoints || 0) + (prev.userHasHyped ? 0 : 1), userHasHyped: true }
      : prev
    );

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
        // Reconcile with server truth
        setReportedIssues(prev => prev.map(issue => issue._id === issueId 
          ? { ...issue, hypePoints: data.hypePoints, userHasHyped: data.userHasHyped }
          : issue
        ));
        setSelectedIssue(prev => prev && prev._id === issueId 
          ? { ...prev, hypePoints: data.hypePoints, userHasHyped: data.userHasHyped }
          : prev
        );
      } else {
        console.error('Hype request failed', response.status);
      }
    } catch (error) {
      console.error("Error hyping issue:", error);
      // Keep optimistic change; admin view will reflect once backend is up
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

            <Link to="/citizen/announcements" onClick={() => markAnnouncementsAsViewed()}>
              <Button
                variant="outline"
                size="lg"
                className="relative bg-white/80 backdrop-blur-md border-blue-200 text-blue-700 px-10 py-4 text-lg font-semibold rounded-2xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
              >
                <Megaphone className="h-5 w-5 mr-2" />
                Announcements
                {hasNewAnnouncements && (
                  <div className="absolute -top-2 -right-2 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-white text-xs font-bold">{newCount > 9 ? '9+' : newCount}</span>
                      </div>
                      <div className="absolute inset-0 w-6 h-6 bg-red-500 rounded-full animate-ping opacity-40"></div>
                    </div>
                  </div>
                )}
              </Button>
            </Link>

            <Link to="/citizen/live-map">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/80 backdrop-blur-md border-blue-200 text-blue-700 px-10 py-4 text-lg font-semibold rounded-2xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
              >
                <MapPin className="h-5 w-5 mr-2" />
                Live Map
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
          className="flex flex-col sm:flex-row items-center justify-between mb-12 p-6 lg:p-8 bg-white/80 backdrop-blur-xl border border-green-100/50 rounded-2xl shadow-xl shadow-green-50/50"
        >
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-green-800 mb-2">
              Local Community Issues
              {searchCity && (
                <span className="text-xl lg:text-2xl font-normal text-green-600/70 ml-3">
                  in {searchCity}
                </span>
              )}
            </h2>
            <p className="text-green-600/80 flex items-center text-sm lg:text-base">
              <TreePine className="h-4 w-4 mr-2" />
              Issues within {LOCATION_RADIUS}km of your area
            </p>
          </div>
          <div className="text-center sm:text-right mt-4 sm:mt-0">
            <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 max-h-[900px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-transparent">
              {filteredIssues.map((issue, index) => (
                <motion.div
                  key={issue._id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                >
                  <Card
                    className={`group relative overflow-hidden bg-white/90 backdrop-blur-xl border border-green-100/50 rounded-2xl hover:bg-white hover:border-green-200 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-100/20 transition-all duration-500 shadow-lg shadow-green-50/50 ${
                      issue.status === "Rejected"
                        ? "opacity-50 grayscale"
                        : "opacity-100"
                    }`}
                  >
                    <div className="relative h-48 overflow-hidden rounded-t-2xl">
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
                      <CardTitle className="text-lg font-bold text-green-800 group-hover:text-green-700 transition-colors line-clamp-1">
                        {issue.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3 p-4">
                      <p className="text-green-700/80 line-clamp-2 leading-relaxed text-sm">
                        {issue.description}
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-green-600/80">
                          <MapPin className="h-3.5 w-3.5 mr-2 text-green-500 flex-shrink-0" />
                          <span className="flex-1 truncate text-xs">
                            {issue.location.address}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-green-600/80 min-w-0">
                            <User className="h-3.5 w-3.5 mr-2 text-green-500 flex-shrink-0" />
                            <span className="truncate text-xs">By {issue.reportedBy}</span>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex-shrink-0 ml-2">
                            {issue.type}
                          </span>
                        </div>

                        <div className="flex items-center text-green-600/80">
                          <Clock className="h-3.5 w-3.5 mr-2 text-green-500 flex-shrink-0" />
                          <span className="text-xs">{issue.reportedAt}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-3 border-t border-green-100/50 gap-2">
                          <Button
                            onClick={() => {
                              setSelectedIssue(issue);
                              setIsViewModalOpen(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1 bg-blue-50/80 border-blue-200/60 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-300 text-xs px-3 py-1.5 h-auto"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="font-medium">View</span>
                          </Button>
                          
                          {/* Hype Button */}
                          <Button
                            onClick={() => handleHypeIssue(issue._id)}
                            variant={issue.userHasHyped ? "default" : "outline"}
                            size="sm"
                            disabled={issue.userHasHyped}
                            className={`flex items-center space-x-1 transition-all duration-300 text-xs px-3 py-1.5 h-auto ${
                              issue.userHasHyped 
                                ? 'bg-red-500 text-white border-red-600 cursor-not-allowed' 
                                : 'hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                            }`}
                          >
                            <Flame 
                              className={`h-3.5 w-3.5 ${
                                issue.userHasHyped ? 'text-white' : ''
                              }`} 
                            />
                            <span className="font-medium">
                              {issue.userHasHyped ? 'Hyped!' : 'Hype'}
                            </span>
                            {issue.hypePoints !== undefined && issue.hypePoints > 0 && (
                              <span>({issue.hypePoints})</span>
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

      {/* Issue Detail Modal */}
      {isViewModalOpen && selectedIssue && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-green-800">
                  {selectedIssue.title}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Issue Image */}
                <div className="relative h-80 overflow-hidden rounded-xl">
                  <img
                    src={selectedIssue.image || "/placeholder.jpg"}
                    alt={selectedIssue.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div
                    className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold ${
                      getStatusColor(selectedIssue.status)
                    } shadow-lg backdrop-blur-sm`}
                  >
                    {selectedIssue.status}
                  </div>
                  
                  {/* Hype Points Display */}
                  {selectedIssue.hypePoints !== undefined && selectedIssue.hypePoints > 0 && (
                    <div className="absolute top-4 left-4 flex items-center bg-red-500/90 backdrop-blur-sm px-3 py-2 rounded-full text-white text-sm font-semibold">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {selectedIssue.hypePoints} Hype Points
                    </div>
                  )}
                </div>

                {/* Issue Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-green-800 flex items-center">
                          <Tag className="h-5 w-5 mr-2" />
                          Issue Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-green-600 font-medium">Type:</span>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            {selectedIssue.type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-green-600 font-medium">Status:</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            getStatusColor(selectedIssue.status)
                          }`}>
                            {selectedIssue.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-green-600 font-medium">Reported By:</span>
                          <span className="text-green-800 font-semibold">{selectedIssue.reportedBy}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-green-600 font-medium">Date Reported:</span>
                          <div className="flex items-center text-green-800">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{selectedIssue.reportedAt}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-blue-800 flex items-center">
                          <Navigation className="h-5 w-5 mr-2" />
                          Location Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-blue-800 font-medium mb-1">Address:</p>
                            <p className="text-blue-600 text-sm leading-relaxed">
                              {selectedIssue.location.address}
                            </p>
                            <div className="mt-2 text-xs text-blue-500">
                              <span>Lat: {selectedIssue.location.latitude.toFixed(6)}</span>
                              <span className="ml-4">Lng: {selectedIssue.location.longitude.toFixed(6)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-amber-800">Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-amber-700 leading-relaxed">
                          {selectedIssue.description}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Community Engagement */}
                    <Card className="bg-red-50 border-red-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-red-800 flex items-center">
                          <Heart className="h-5 w-5 mr-2" />
                          Community Engagement
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-red-600 font-medium">Hype Points:</span>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-red-500" />
                            <span className="text-red-800 font-bold text-lg">
                              {selectedIssue.hypePoints || 0}
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handleHypeIssue(selectedIssue._id)}
                          disabled={selectedIssue.userHasHyped}
                          variant={selectedIssue.userHasHyped ? 'default' : undefined}
                          className={`w-full transition-all duration-300 ${
                            selectedIssue.userHasHyped
                              ? 'bg-red-500 text-white cursor-not-allowed border-red-600'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          <Flame 
                            className={`h-4 w-4 mr-2 ${
                              selectedIssue.userHasHyped ? 'text-white' : ''
                            }`} 
                          />
                          {selectedIssue.userHasHyped ? 'Hyped!' : 'Hype This Issue'}
                        </Button>
                        
                        <p className="text-red-600 text-xs text-center">
                          Help bring attention to important community issues
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot */}
      <Chatbot />
    </motion.div>
  );
};

export default CitizenHome;
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  MapPin,
  Filter,
  Search,
  Layers,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Zap,
  CheckCircle,
  Clock,
  Building,
  ArrowLeft,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { VITE_BACKEND_URL } from "../config/config";
import { motion } from "framer-motion";
import Chatbot from "../components/Chatbot";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Issue {
  _id: string;
  title: string;
  description: string;
  type: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  reportedBy: string;
  reportedAt: string;
  image: string;
  status: string;
  department?: string;
  priority?: "Low" | "Medium" | "High" | "Critical";
  hypePoints?: number;
  severityScore?: number;
  urgencyLevel?: string;
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface MapStats {
  totalReports: number;
  activeReports: number;
  resolvedReports: number;
  criticalReports: number;
  averageSeverity: number;
}

// Custom icons for different issue types and priorities
const createCustomIcon = (type: string, priority: string) => {
  const getColor = () => {
    switch (priority) {
      case "Critical": return "#dc2626";
      case "High": return "#ea580c";
      case "Medium": return "#d97706";
      case "Low": return "#16a34a";
      default: return "#6b7280";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "Road Infrastructure": return "🛣️";
      case "Waste Management": return "♻️";
      case "Environmental Issues": return "🌱";
      case "Utilities & Infrastructure": return "⚡";
      case "Public Safety": return "🛡️";
      default: return "📍";
    }
  };

  return L.divIcon({
    html: `
      <div style="
        background-color: ${getColor()};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${getIcon()}
      </div>
    `,
    className: "custom-marker",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Map controller component for real-time updates
const MapController = ({ issues }: { issues: Issue[] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (issues.length > 0) {
      const bounds = L.latLngBounds(issues.map(issue => [issue.location.latitude, issue.location.longitude]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [issues, map]);

  return null;
};

// Custom Heatmap Component using CircleMarkers
const CustomHeatmap = ({ points }: { points: HeatmapPoint[] }) => {
  return (
    <>
      {points.map((point, index) => (
        <CircleMarker
          key={index}
          center={[point.lat, point.lng]}
          radius={Math.max(5, point.intensity * 20)}
          fillColor={point.intensity > 0.7 ? "#dc2626" : point.intensity > 0.5 ? "#ea580c" : point.intensity > 0.3 ? "#d97706" : "#16a34a"}
          color={"transparent"}
          fillOpacity={0.6}
          weight={0}
        />
      ))}
    </>
  );
};

const LiveMap = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [severityFilters, setSeverityFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [mapStats, setMapStats] = useState<MapStats>({
    totalReports: 0,
    activeReports: 0,
    resolvedReports: 0,
    criticalReports: 0,
    averageSeverity: 0,
  });
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]); // Default to Delhi
  const intervalRef = useRef<number>();

  const categories = [
    "Road Infrastructure",
    "Waste Management", 
    "Environmental Issues",
    "Utilities & Infrastructure",
    "Public Safety",
    "Other"
  ];

  const severityLevels = ["Low", "Medium", "High", "Critical"];
  const statusOptions = ["Pending", "In Progress", "Resolved", "Rejected"];

  // Fetch issues from API
  const fetchIssues = useCallback(async () => {
    try {
      const response = await fetch(`${VITE_BACKEND_URL}/api/v1/all-issues`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      const data = await response.json();
      
      if (Array.isArray(data.issues)) {
        const issuesWithLocation = data.issues.filter(
          (issue: Issue) => issue.location?.latitude && issue.location?.longitude
        );
        setIssues(issuesWithLocation);
        
        // Calculate map statistics
        const stats: MapStats = {
          totalReports: issuesWithLocation.length,
          activeReports: issuesWithLocation.filter((i: Issue) => i.status !== "Resolved").length,
          resolvedReports: issuesWithLocation.filter((i: Issue) => i.status === "Resolved").length,
          criticalReports: issuesWithLocation.filter((i: Issue) => i.priority === "Critical").length,
          averageSeverity: issuesWithLocation.reduce((acc: number, i: Issue) => acc + (i.severityScore || 5), 0) / issuesWithLocation.length || 0,
        };
        setMapStats(stats);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter issues based on search and filters
  useEffect(() => {
    let filtered = issues;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.department && issue.department.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilters.length > 0) {
      filtered = filtered.filter(issue => categoryFilters.includes(issue.type));
    }

    // Severity filter
    if (severityFilters.length > 0) {
      filtered = filtered.filter(issue => issue.priority && severityFilters.includes(issue.priority));
    }

    // Status filter
    if (statusFilters.length > 0) {
      filtered = filtered.filter(issue => statusFilters.includes(issue.status));
    }

    setFilteredIssues(filtered);
  }, [issues, searchQuery, categoryFilters, severityFilters, statusFilters]);

  // Set up real-time updates
  useEffect(() => {
    fetchIssues();
    
    // Poll for updates every 30 seconds
    intervalRef.current = window.setInterval(fetchIssues, 30000);
    
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [fetchIssues]);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log("Geolocation error:", error);
          // Keep default center (Delhi)
        }
      );
    }
  }, []);

  // Prepare heatmap data
  const heatmapData: HeatmapPoint[] = filteredIssues.map(issue => ({
    lat: issue.location.latitude,
    lng: issue.location.longitude,
    intensity: (issue.severityScore || 5) / 10, // Normalize to 0-1
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "In Progress": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Rejected": return "bg-rose-50 text-rose-700 border-rose-200";
      case "Pending": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-800 border-red-300";
      case "High": return "bg-orange-100 text-orange-800 border-orange-300";
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Low": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Resolved": return <CheckCircle className="h-4 w-4" />;
      case "In Progress": return <Activity className="h-4 w-4" />;
      case "Rejected": return <AlertTriangle className="h-4 w-4" />;
      case "Pending": return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <RefreshCw className="h-12 w-12 animate-spin text-green-600 mb-4" />
        <p className="text-slate-600 text-lg font-medium">Loading live map...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.1),transparent_50%)] -z-1" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.08),transparent_50%)] -z-1" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-green-200/50 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/citizen">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-green-700 hover:text-green-800 hover:bg-green-100/50">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </Link>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-green-800">Live Issue Map</h1>
              <p className="text-green-600 text-sm">Real-time visualization of community reports</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={fetchIssues}
                variant="outline"
                size="sm"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Statistics Cards */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          {[
            { title: 'Total Reports', value: mapStats.totalReports, icon: BarChart3, color: "from-blue-500 to-cyan-500" },
            { title: 'Active Issues', value: mapStats.activeReports, icon: Activity, color: "from-orange-500 to-red-500" },
            { title: 'Resolved', value: mapStats.resolvedReports, icon: CheckCircle, color: "from-emerald-500 to-green-500" },
            { title: 'Critical', value: mapStats.criticalReports, icon: AlertTriangle, color: "from-red-500 to-pink-500" },
            { title: 'Avg Severity', value: mapStats.averageSeverity.toFixed(1), icon: TrendingUp, color: "from-purple-500 to-indigo-500" },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
              <p className="text-slate-600 text-sm font-medium">{stat.title}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-green-100"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search issues, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 bg-slate-50/50 border-slate-200 focus:border-green-400 focus:ring-green-400 rounded-xl"
              />
            </div>

            {/* Filters and Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Layer Controls */}
              <div className="flex items-center bg-slate-100 rounded-xl p-1">
                <Button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  size="sm"
                  variant={showHeatmap ? 'default' : 'ghost'}
                  className={`rounded-lg ${showHeatmap ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500'}`}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Heatmap
                </Button>
                <Button
                  onClick={() => setShowMarkers(!showMarkers)}
                  size="sm"
                  variant={showMarkers ? 'default' : 'ghost'}
                  className={`rounded-lg ${showMarkers ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500'}`}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Markers
                </Button>
              </div>

              {/* Category Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 shadow-sm rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm">
                    <Filter className="h-4 w-4" />
                    Category ({categoryFilters.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[220px] rounded-xl bg-white/95 backdrop-blur-xl border-green-100">
                  {categories.map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={categoryFilters.includes(category)}
                      onCheckedChange={(checked) =>
                        setCategoryFilters((prev) =>
                          checked ? [...prev, category] : prev.filter((c) => c !== category)
                        )
                      }
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Severity Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 shadow-sm rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm">
                    <Zap className="h-4 w-4" />
                    Severity ({severityFilters.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px] rounded-xl bg-white/95 backdrop-blur-xl border-green-100">
                  {severityLevels.map((level) => (
                    <DropdownMenuCheckboxItem
                      key={level}
                      checked={severityFilters.includes(level)}
                      onCheckedChange={(checked) =>
                        setSeverityFilters((prev) =>
                          checked ? [...prev, level] : prev.filter((s) => s !== level)
                        )
                      }
                    >
                      {level}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 shadow-sm rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm">
                    <Activity className="h-4 w-4" />
                    Status ({statusFilters.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px] rounded-xl bg-white/95 backdrop-blur-xl border-green-100">
                  {statusOptions.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={statusFilters.includes(status)}
                      onCheckedChange={(checked) =>
                        setStatusFilters((prev) =>
                          checked ? [...prev, status] : prev.filter((s) => s !== status)
                        )
                      }
                    >
                      {getStatusIcon(status)}
                      <span className="ml-2">{status}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        {/* Map Container */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100 overflow-hidden"
        >
          <div className="h-[600px] w-full">
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              className="rounded-2xl"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Custom Heatmap Layer */}
              {showHeatmap && heatmapData.length > 0 && (
                <CustomHeatmap points={heatmapData} />
              )}

              {/* Issue Markers */}
              {showMarkers && filteredIssues.map((issue) => (
                <Marker
                  key={issue._id}
                  position={[issue.location.latitude, issue.location.longitude]}
                  icon={createCustomIcon(issue.type, issue.priority || "Low")}
                >
                  <Popup className="custom-popup">
                    <div className="p-2 min-w-[250px]">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-slate-800 text-sm">{issue.title}</h3>
                        <Badge className={`${getPriorityColor(issue.priority!)} text-xs ml-2`}>
                          {issue.priority}
                        </Badge>
                      </div>
                      
                      {issue.image && (
                        <img
                          src={issue.image}
                          alt={issue.title}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">{issue.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={`${getStatusColor(issue.status)} text-xs`}>
                            {getStatusIcon(issue.status)}
                            <span className="ml-1">{issue.status}</span>
                          </Badge>
                          {issue.severityScore && (
                            <div className="text-xs text-slate-600">
                              Severity: {issue.severityScore}/10
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center text-xs text-slate-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{issue.location.address}</span>
                        </div>
                        
                        {issue.department && (
                          <div className="flex items-center text-xs text-slate-500">
                            <Building className="h-3 w-3 mr-1" />
                            <span>{issue.department}</span>
                          </div>
                        )}
                        
                        <div className="text-xs text-slate-400">
                          Reported: {new Date(issue.reportedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              <MapController issues={filteredIssues} />
            </MapContainer>
          </div>
        </motion.div>

        {/* Results Summary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-green-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-800">{filteredIssues.length}</span> of{" "}
                <span className="font-semibold text-slate-800">{issues.length}</span> reports
              </div>
              {(categoryFilters.length > 0 || severityFilters.length > 0 || statusFilters.length > 0 || searchQuery) && (
                <Button
                  onClick={() => {
                    setCategoryFilters([]);
                    setSeverityFilters([]);
                    setStatusFilters([]);
                    setSearchQuery("");
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-lg"
                >
                  Clear Filters
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Auto-refreshes every 30s</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default LiveMap;

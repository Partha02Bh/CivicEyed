import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  ChevronsUpDown,
  Edit,
  Search,
  Trash2,
  User,
  UserPlus,
  Building,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Filter,
  Grid3X3,
  List,
  Users,
  Activity,
  MapPin,
  TrendingUp,
  Route,
  Zap,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { VITE_BACKEND_URL } from "../config/config";
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import { motion } from "framer-motion";
import Player from "lottie-react";
import starloader from "../assets/animations/starloder.json";
import { useLoader } from "../contexts/LoaderContext";

interface StatusTimeline {
  status: string;
  timestamp: string;
  updatedBy: string;
  notes?: string;
}

interface Issues {
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
  assignedPOC?: {
    name: string;
    phone: string;
    email: string;
  };
  priority?: "Low" | "Medium" | "High" | "Critical";
  hypePoints?: number;
  userHasHyped?: boolean;
  statusTimeline?: StatusTimeline[];
  autoRouted?: boolean;
  routingReason?: string;
  severityScore?: number;
  urgencyLevel?: string;
}

interface DepartmentStats {
  department: string;
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  avgResolutionTime: number;
}

const AdminHome = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [departmentFilters, setDepartmentFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "department">("grid");
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<Issues[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issues | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [pocForm, setPocForm] = useState({
    name: "",
    phone: "",
    email: "",
    department: "",
  });
  const { hideLoader } = useLoader();


  const departments = [
    "Public Works", "Sanitation", "Transportation", "Utilities",
    "Health & Safety", "Parks & Recreation", "IT Services", "Emergency Services",
  ];
  const priorities = ["Low", "Medium", "High", "Critical"];

  // Auto-routing logic based on issue type and severity
  const getAutoDepartment = (issueType: string, severityScore?: number, location?: string) => {
    const routingMap: { [key: string]: string } = {
      "Road Infrastructure": "Public Works",
      "Waste Management": "Sanitation",
      "Environmental Issues": "Health & Safety",
      "Utilities & Infrastructure": "Utilities",
      "Public Safety": "Emergency Services",
      "Other": "Public Works"
    };
    
    // High severity issues go to Emergency Services first
    if (severityScore && severityScore >= 8) {
      return "Emergency Services";
    }
    
    return routingMap[issueType] || "Public Works";
  };

  const getRoutingReason = (issueType: string, severityScore?: number) => {
    if (severityScore && severityScore >= 8) {
      return `High severity issue (${severityScore}/10) - routed to Emergency Services for immediate attention`;
    }
    return `Auto-routed based on issue type: ${issueType}`;
  };

  // Function to calculate average resolution time for resolved issues
  const calculateAvgResolutionTime = (issues: Issues[]): number => {
    const resolvedIssues = issues.filter(issue => issue.status === "Resolved" && issue.statusTimeline);
    
    if (resolvedIssues.length === 0) return 0;
    
    const resolutionTimes = resolvedIssues.map(issue => {
      const timeline = issue.statusTimeline || [];
      const reportedEntry = timeline.find(entry => entry.status === "Reported");
      const resolvedEntry = timeline.find(entry => entry.status === "Resolved");
      
      if (reportedEntry && resolvedEntry) {
        const reportedTime = new Date(reportedEntry.timestamp).getTime();
        const resolvedTime = new Date(resolvedEntry.timestamp).getTime();
        const resolutionTimeMs = resolvedTime - reportedTime;
        const resolutionTimeHours = resolutionTimeMs / (1000 * 60 * 60);
        return resolutionTimeHours;
      }
      return 0;
    }).filter(time => time > 0);
    
    if (resolutionTimes.length === 0) return 0;
    
    const avgResolutionTimeHours = resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length;
    const avgResolutionTimeDays = avgResolutionTimeHours / 24;
    
    return Math.round(avgResolutionTimeDays * 10) / 10; // Round to 1 decimal place
  };

  useEffect(() => {
    let intervalId: any;
    const fetchIssues = async () => {
      try {
        const response = await fetch(`${VITE_BACKEND_URL}/api/v1/all-issues`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });
        const data = await response.json();
        if (Array.isArray(data.issues)) {
          const enhancedIssues = data.issues.map(
            (issue: Issues, index: number) => {
              // Auto-route new issues
              const autoDepartment = getAutoDepartment(issue.type, issue.severityScore, issue.location?.address);
              const routingReason = getRoutingReason(issue.type, issue.severityScore);
              
              // Create initial status timeline
              const initialTimeline: StatusTimeline[] = [
                {
                  status: "Reported",
                  timestamp: issue.reportedAt,
                  updatedBy: "System",
                  notes: "Issue reported by citizen"
                },
                {
                  status: "Auto-Routed",
                  timestamp: new Date().toISOString(),
                  updatedBy: "Auto-Routing System",
                  notes: routingReason
                }
              ];
              
              return {
                ...issue,
                department: issue.department || autoDepartment,
                priority: issue.priority || (priorities[index % priorities.length] as "Low" | "Medium" | "High" | "Critical"),
                autoRouted: !issue.department,
                routingReason: !issue.department ? routingReason : undefined,
                statusTimeline: issue.statusTimeline || initialTimeline
              };
            }
          );
          
          // Sort issues by reportedAt timestamp (most recent first)
          const sortedIssues = enhancedIssues.sort((a: Issues, b: Issues) => {
            const dateA = new Date(a.reportedAt).getTime();
            const dateB = new Date(b.reportedAt).getTime();
            return dateB - dateA; // Descending order (newest first)
          });
          
          setIssues(sortedIssues);
          
          // Calculate department statistics
          const deptStats = departments.map(dept => {
            const deptIssues = sortedIssues.filter((issue: Issues) => issue.department === dept);
            const avgResolutionTime = calculateAvgResolutionTime(deptIssues);
            
            return {
              department: dept,
              total: deptIssues.length,
              pending: deptIssues.filter((i: Issues) => i.status === "Pending").length,
              inProgress: deptIssues.filter((i: Issues) => i.status === "In Progress").length,
              resolved: deptIssues.filter((i: Issues) => i.status === "Resolved").length,
              avgResolutionTime: avgResolutionTime
            };
          });
          setDepartmentStats(deptStats);
        } else {
          setIssues([]);
          setDepartmentStats([]);
        }
      } catch (error) {
        console.error("Error fetching issues:", error);
      } finally {
        if (loading) {
          setTimeout(() => {
            setLoading(false);
            hideLoader();
          }, 800);
        }
      }
    };

    // initial fetch
    fetchIssues();
    // poll every 5 seconds
    intervalId = setInterval(fetchIssues, 5000);

    return () => clearInterval(intervalId);
  }, [hideLoader, loading]);

  const handleStatusUpdate = async (issueId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(
        `${VITE_BACKEND_URL}/api/v1/admin/issue/${issueId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify({ status, notes }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setIssues((prev) =>
          prev.map((i) => {
            if (i._id === issueId) {
              const newTimelineEntry: StatusTimeline = {
                status,
                timestamp: new Date().toISOString(),
                updatedBy: "Admin", // In real app, get from auth context
                notes: notes || `Status updated to ${status}`
              };
              return {
                ...i,
                status,
                statusTimeline: [...(i.statusTimeline || []), newTimelineEntry]
              };
            }
            return i;
          })
        );
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error updating issue status:", error);
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return;
    try {
      const response = await fetch(
        `${VITE_BACKEND_URL}/api/v1/issue/admin/${issueId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setIssues((prev) => prev.filter((i) => i._id !== issueId));
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error deleting issue:", error);
    }
  };

  const openAssignModal = (issue: Issues) => {
    setSelectedIssue(issue);
    setPocForm({
        department: issue.department || "",
        name: issue.assignedPOC?.name || "",
        phone: issue.assignedPOC?.phone || "",
        email: issue.assignedPOC?.email || ""
    });
    setIsAssignModalOpen(true);
  };

  const openViewModal = (issue: Issues) => {
    setSelectedIssue(issue);
    setIsViewModalOpen(true);
  };

  const openTimelineModal = (issue: Issues) => {
    setSelectedIssue(issue);
    setIsTimelineModalOpen(true);
  };

  const closeModals = () => {
    setIsAssignModalOpen(false);
    setIsViewModalOpen(false);
    setIsTimelineModalOpen(false);
    setSelectedIssue(null);
    setPocForm({ name: "", phone: "", email: "", department: "" });
  };

  const handleAssignPOC = () => {
    if (!selectedIssue || !pocForm.name || !pocForm.phone || !pocForm.department) {
      alert("Please fill in all required fields");
      return;
    }
    setIssues((prev) =>
      prev.map((issue) =>
        issue._id === selectedIssue._id
          ? {
              ...issue,
              assignedPOC: {
                name: pocForm.name,
                phone: pocForm.phone,
                email: pocForm.email,
              },
              department: pocForm.department,
              status: issue.status === "Pending" ? "In Progress" : issue.status,
            }
          : issue
      )
    );
    closeModals();
  };

  const filteredIssues = issues.filter((issue) => {
    const searchMatch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.department && issue.department.toLowerCase().includes(searchQuery.toLowerCase()));
    const statusMatch = statusFilters.length === 0 || statusFilters.includes(issue.status);
    const departmentMatch = departmentFilters.length === 0 || (issue.department && departmentFilters.includes(issue.department));
    return searchMatch && statusMatch && departmentMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "In Progress": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Rejected": return "bg-rose-50 text-rose-700 border-rose-200";
      case "Pending": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Resolved": return <CheckCircle className="h-4 w-4" />;
      case "In Progress": return <Activity className="h-4 w-4" />;
      case "Rejected": return <XCircle className="h-4 w-4" />;
      case "Pending": return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
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

  // Convert severity score (1-10) to severity level and get appropriate styling
  const getSeverityLevel = (score?: number): string => {
    if (!score) return "Unknown";
    if (score >= 8) return "Critical";
    if (score >= 6) return "High";
    if (score >= 4) return "Medium";
    return "Low";
  };

  const getSeverityColor = (score?: number) => {
    const level = getSeverityLevel(score);
    switch (level) {
      case "Critical": return "bg-red-100 text-red-800 border-red-300";
      case "High": return "bg-orange-100 text-orange-800 border-orange-300";
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Low": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getSeverityIcon = (score?: number) => {
    const level = getSeverityLevel(score);
    switch (level) {
      case "Critical": return <AlertTriangle className="h-3 w-3" />;
      case "High": return <Zap className="h-3 w-3" />;
      case "Medium": return <Activity className="h-3 w-3" />;
      case "Low": return <CheckCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const stats = {
    total: issues.length,
    resolved: issues.filter((i) => i.status === "Resolved").length,
    inProgress: issues.filter((i) => i.status === "In Progress").length,
    pending: issues.filter((i) => i.status === "Pending").length,
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <Player autoplay loop animationData={starloader} style={{ height: "200px", width: "200px" }} />
        <p className="text-slate-600 mt-4 text-lg font-medium">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <HeaderAfterAuth />
      <div className="pt-20 container mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-green-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-green-800 via-emerald-700 to-green-600 bg-clip-text text-transparent mb-3">
Admin Dashboard
              </h1>
              <p className="text-slate-600 text-xl font-medium">
Monitor, manage, and resolve community issues efficiently.
              </p>
            </div>
            <div className="flex gap-4">
              <Link to="/admin/create-announcement">
                <Button className="px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                  <FileText className="h-5 w-5 mr-2" /> Create Announcement
                </Button>
              </Link>
              <Link to="/admin/manage-announcements">
                <Button variant="outline" className="px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-blue-200 hover:border-blue-300 bg-white/50 backdrop-blur-sm text-blue-700 hover:bg-blue-50">
                  <Users className="h-5 w-5 mr-2" /> Manage Announcements
                </Button>
              </Link>
              <Link to="/admin/profile">
                <Button variant="outline" className="px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-green-200 hover:border-green-300 bg-white/50 backdrop-blur-sm">
                  <User className="h-5 w-5 mr-2 text-green-600" /> Profile
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { title: 'Total Issues', value: stats.total, icon: FileText, bgGradient: "from-blue-500 to-cyan-500" },
            { title: 'Resolved', value: stats.resolved, icon: CheckCircle, bgGradient: "from-emerald-500 to-green-500" },
            { title: 'In Progress', value: stats.inProgress, icon: Activity, bgGradient: "from-purple-500 to-indigo-500" },
            { title: 'Pending', value: stats.pending, icon: Clock, bgGradient: "from-amber-500 to-orange-500" },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 + 0.2 }}
              className="relative group bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 hover:scale-105"
            >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.bgGradient} shadow-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-3xl font-black text-slate-800 mb-1">{stat.value}</div>
                <p className="text-slate-600 font-medium">{stat.title}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Search and Controls */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-green-100"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
placeholder="Search issues, locations, departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 bg-slate-50/50 border-slate-200 focus:border-green-400 focus:ring-green-400 rounded-xl text-sm w-full"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-slate-100 rounded-xl p-1">
                <Button onClick={() => setViewMode("grid")} size="sm" variant={viewMode === 'grid' ? 'default' : 'ghost'} className={`rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500'}`}><Grid3X3 className="h-4 w-4" /></Button>
                <Button onClick={() => setViewMode("list")} size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} className={`rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500'}`}><List className="h-4 w-4" /></Button>
                <Button onClick={() => setViewMode("department")} size="sm" variant={viewMode === 'department' ? 'default' : 'ghost'} className={`rounded-lg ${viewMode === 'department' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500'}`}><BarChart3 className="h-4 w-4" /></Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 shadow-sm rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm">
                    <Filter className="h-4 w-4" /> Status <ChevronsUpDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px] rounded-xl bg-white/95 backdrop-blur-xl border-green-100">
                  {["Pending", "In Progress", "Resolved", "Rejected"].map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={statusFilters.includes(status)}
                      onCheckedChange={(checked) => setStatusFilters((prev) => checked ? [...prev, status] : prev.filter((s) => s !== status))}
                    >
                      {getStatusIcon(status)} <span className="ml-2">{status}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 shadow-sm rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm">
                    <Building className="h-4 w-4" /> Department <ChevronsUpDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[220px] rounded-xl bg-white/95 backdrop-blur-xl border-green-100">
                  {departments.map((dept) => (
                    <DropdownMenuCheckboxItem
                      key={dept}
                      checked={departmentFilters.includes(dept)}
                      onCheckedChange={(checked) => setDepartmentFilters((prev) => checked ? [...prev, dept] : prev.filter((d) => d !== dept))}
                    >
                      <Building className="h-4 w-4" /> <span className="ml-2">{dept}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        {/* Issues Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {viewMode === "department" ? (
            // Department View
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {departmentStats.map((dept, index) => (
                  <motion.div
                    key={dept.department}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-green-100 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                        <Building className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-800">{dept.total}</div>
                        <div className="text-xs text-slate-500">Total Issues</div>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 mb-4">{dept.department}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-600">Pending</span>
                        <span className="font-semibold text-amber-700">{dept.pending}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600">In Progress</span>
                        <span className="font-semibold text-blue-700">{dept.inProgress}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600">Resolved</span>
                        <span className="font-semibold text-green-700">{dept.resolved}</span>
                      </div>
                      <div className="pt-3 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Avg Resolution</span>
                          <span className="text-xs font-medium text-slate-700">
                            {dept.avgResolutionTime > 0 ? `${dept.avgResolutionTime}d` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setDepartmentFilters([dept.department])}
                      className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl"
                      size="sm"
                    >
                      View Issues
                    </Button>
                  </motion.div>
                ))}
              </div>
              
              {/* Department Issues List */}
              {departmentFilters.length > 0 && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                      <Building className="h-5 w-5 mr-2 text-green-600" />
                      {departmentFilters.join(", ")} Issues
                    </h3>
                    <Button
                      onClick={() => setDepartmentFilters([])}
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                    >
                      Clear Filter
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredIssues.slice(0, 6).map((issue) => (
                      <div key={issue._id} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-slate-800 text-sm">{issue.title}</h4>
                          <div className="flex flex-col gap-1">
                            <Badge className={`${getPriorityColor(issue.priority!)} text-xs`}>{issue.priority}</Badge>
                            {issue.severityScore && (
                              <Badge className={`${getSeverityColor(issue.severityScore)} text-xs flex items-center gap-1`}>
                                {getSeverityIcon(issue.severityScore)}
                                AI: {issue.severityScore}/10
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className={`${getStatusColor(issue.status)} text-xs`}>{issue.status}</Badge>
                          <div className="flex gap-1">
                            <Button onClick={() => openViewModal(issue)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button onClick={() => openTimelineModal(issue)} size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Clock className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {issue.autoRouted && (
                          <div className="mt-2 flex items-center text-xs text-blue-600">
                            <Route className="h-3 w-3 mr-1" />
                            <span>Auto-routed</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIssues.map((issue, index) => (
                <motion.div key={issue._id} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${issue.priority === "Critical" ? "from-red-500" : issue.priority === "High" ? "from-orange-500" : issue.priority === "Medium" ? "from-yellow-500" : "from-green-500"}`}></div>
                  {issue.image && (
                    <div className="relative h-40 w-full overflow-hidden">
                      <img src={issue.image} alt={issue.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors flex-1 pr-2">{issue.title}</h3>
                      <div className="flex flex-col gap-2">
                        <Badge className={`${getPriorityColor(issue.priority!)} text-xs font-semibold`}>{issue.priority}</Badge>
                        {issue.severityScore && (
                          <Badge className={`${getSeverityColor(issue.severityScore)} text-xs font-semibold flex items-center gap-1`}>
                            {getSeverityIcon(issue.severityScore)}
                            AI: {getSeverityLevel(issue.severityScore)} ({issue.severityScore}/10)
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-slate-600"><Building className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0" /> <span className="font-medium">{issue.department}</span></div>
                      <div className="flex items-center text-sm text-slate-600"><MapPin className="h-4 w-4 text-rose-500 mr-2 flex-shrink-0" /> <span className="truncate">{issue.location.address}</span></div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(issue.status)} flex items-center gap-1 font-medium`}>{getStatusIcon(issue.status)} {issue.status}</Badge>
                        {typeof issue.hypePoints === 'number' && (
                          <div className="flex items-center text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                            <TrendingUp className="h-3.5 w-3.5 mr-1" />
                            <span className="font-semibold">{issue.hypePoints}</span>
                          </div>
                        )}
                      </div>
                      {issue.assignedPOC && <div className="flex items-center text-xs text-slate-600 bg-green-50 px-2 py-1 rounded-lg"><Users className="h-3 w-3 text-green-600 mr-1" /> <span className="font-medium">{issue.assignedPOC.name}</span></div>}
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                      <Button variant="ghost" size="sm" onClick={() => openViewModal(issue)} className="flex-1 hover:bg-green-50 hover:text-green-600 rounded-xl"><Eye className="h-4 w-4 mr-2" /> View</Button>
                      <Button variant="ghost" size="sm" onClick={() => openTimelineModal(issue)} className="flex-1 hover:bg-purple-50 hover:text-purple-600 rounded-xl"><Clock className="h-4 w-4 mr-2" /> Timeline</Button>
                      <Button variant="ghost" size="sm" onClick={() => openAssignModal(issue)} className="flex-1 hover:bg-blue-50 hover:text-blue-600 rounded-xl"><UserPlus className="h-4 w-4 mr-2" /> Assign</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-xl"><Edit className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl bg-white/95 backdrop-blur-xl">
                          {["Resolved", "In Progress", "Rejected", "Pending"].map((status) => (
                            <button key={status} onClick={() => handleStatusUpdate(issue._id, status)} className="flex items-center w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors text-sm rounded-lg">
                              {getStatusIcon(status)}<span className="ml-2">{status}</span>
                            </button>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteIssue(issue._id)} className="hover:bg-red-50 hover:text-red-600 rounded-xl"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
             <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100 overflow-hidden">
                {filteredIssues.map((issue, index) => (
                    <motion.div key={issue._id} initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, delay: index * 0.05 }} className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors border-b border-green-100/50 border-l-4 border-l-transparent hover:border-l-emerald-400">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                {issue.image && (
                                  <img src={issue.image} alt={issue.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap gap-3 mb-2">
                                        <h3 className="font-bold text-lg text-slate-800">{issue.title}</h3>
                                        <Badge className={`${getPriorityColor(issue.priority!)} text-xs`}>{issue.priority}</Badge>
                                        {issue.severityScore && (
                                          <Badge className={`${getSeverityColor(issue.severityScore)} text-xs flex items-center gap-1`}>
                                            {getSeverityIcon(issue.severityScore)}
                                            AI: {getSeverityLevel(issue.severityScore)} ({issue.severityScore}/10)
                                          </Badge>
                                        )}
                                        <Badge className={`${getStatusColor(issue.status)} flex items-center gap-1`}>{getStatusIcon(issue.status)} {issue.status}</Badge>
                                        {typeof issue.hypePoints === 'number' && (
                                          <div className="flex items-center text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                                            <TrendingUp className="h-3.5 w-3.5 mr-1" />
                                            <span className="font-semibold">{issue.hypePoints}</span>
                                          </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
                                        <div className="flex items-center"><Building className="h-4 w-4 text-emerald-600 mr-2" /> {issue.department}</div>
                                        {issue.assignedPOC && <div className="flex items-center"><Users className="h-4 w-4 text-green-600 mr-2" /> {issue.assignedPOC.name}</div>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 ml-auto sm:ml-6 flex-shrink-0">
                                <Button variant="ghost" size="sm" onClick={() => openViewModal(issue)} className="rounded-xl hover:bg-green-50"><Eye className="h-4 w-4 mr-1" /> View</Button>
                                <Button variant="ghost" size="sm" onClick={() => openTimelineModal(issue)} className="rounded-xl hover:bg-purple-50"><Clock className="h-4 w-4 mr-1" /> Timeline</Button>
                                <Button variant="ghost" size="sm" onClick={() => openAssignModal(issue)} className="rounded-xl hover:bg-blue-50"><UserPlus className="h-4 w-4 mr-1" /> Assign</Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteIssue(issue._id)} className="hover:bg-red-50 hover:text-red-600 rounded-xl"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </motion.div>
                ))}
             </div>
          )}

          {filteredIssues.length === 0 && (
            <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-green-100">
              <Search className="h-16 w-16 text-slate-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No issues found</h3>
              <p className="text-slate-500">Try adjusting your search criteria or filters.</p>
            </div>
          )}
        </motion.div>
      </div>

       {/* Modals */}
        {isAssignModalOpen && selectedIssue && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}
                    className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full border border-green-100">
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-slate-800 flex items-center"><UserPlus className="h-6 w-6 mr-3 text-emerald-600" /> Assign POC</h3>
                            <button onClick={closeModals} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl"><XCircle className="h-6 w-6" /></button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Department *</label>
                                <select value={pocForm.department} onChange={(e) => setPocForm({ ...pocForm, department: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50/50 transition-all">
                                    <option value="">Select department</option>
                                    {departments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">POC Name *</label>
                                <Input placeholder="Enter full name" value={pocForm.name} onChange={(e) => setPocForm({ ...pocForm, name: e.target.value })} className="rounded-xl bg-slate-50/50 border-slate-200 focus:border-green-500 focus:ring-green-500 py-3"/>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                                <Input placeholder="Enter phone number" value={pocForm.phone} onChange={(e) => setPocForm({ ...pocForm, phone: e.target.value })} className="rounded-xl bg-slate-50/50 border-slate-200 focus:border-green-500 focus:ring-green-500 py-3"/>
                            </div>
                             <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email (Optional)</label>
                                <Input type="email" placeholder="Enter email address" value={pocForm.email} onChange={(e) => setPocForm({ ...pocForm, email: e.target.value })} className="rounded-xl bg-slate-50/50 border-slate-200 focus:border-green-500 focus:ring-green-500 py-3"/>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                            <Button variant="outline" onClick={closeModals} className="px-6 py-3 rounded-xl border-slate-300 hover:bg-slate-50">Cancel</Button>
                            <Button onClick={handleAssignPOC} className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all">Assign POC</Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}

        {isViewModalOpen && selectedIssue && (
             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}
                    className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-green-100">
                     <div className="p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <div className="flex items-center flex-wrap gap-3 mb-3">
                                    <h2 className="text-3xl font-bold text-slate-800">{selectedIssue.title}</h2>
                                    <Badge className={`${getPriorityColor(selectedIssue.priority!)} text-sm font-semibold`}>{selectedIssue.priority}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${getStatusColor(selectedIssue.status)} flex items-center gap-2 w-fit text-sm font-medium`}>{getStatusIcon(selectedIssue.status)} {selectedIssue.status}</Badge>
                                  {typeof selectedIssue.hypePoints === 'number' && (
                                    <div className="flex items-center text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                                      <TrendingUp className="h-3.5 w-3.5 mr-1" />
                                      <span className="font-semibold">{selectedIssue.hypePoints}</span>
                                    </div>
                                  )}
                                </div>
                            </div>
                            <button onClick={closeModals} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl"><XCircle className="h-6 w-6" /></button>
                        </div>
                        {selectedIssue.image && (
                          <div className="relative w-full h-64 rounded-2xl overflow-hidden mb-6">
                            <img src={selectedIssue.image} alt={selectedIssue.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          </div>
                        )}
                        <div className="space-y-6">
                            <div className="bg-slate-50/50 rounded-2xl p-6"><h3 className="font-semibold text-slate-800 mb-3 flex items-center"><FileText className="h-5 w-5 mr-2 text-emerald-600" /> Description</h3><p className="text-slate-700 leading-relaxed">{selectedIssue.description}</p></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-green-50/50 rounded-2xl p-6">
                                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center"><Building className="h-5 w-5 mr-2 text-green-600" /> Department</h4>
                                    <p className="text-slate-700 font-medium">{selectedIssue.department}</p>
                                    <div className="mt-2"><Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-200">{selectedIssue.type}</Badge></div>
                                </div>
                                <div className="bg-rose-50/50 rounded-2xl p-6">
                                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center"><MapPin className="h-5 w-5 mr-2 text-rose-600" /> Location</h4>
                                    <p className="text-slate-700">{selectedIssue.location.address}</p>
                                </div>
                            </div>
                            {selectedIssue.assignedPOC && (
                                <div className="bg-blue-50/50 rounded-2xl p-6">
                                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center"><Users className="h-5 w-5 mr-2 text-blue-600" /> Assigned Point of Contact</h4>
                                    <div className="space-y-2 text-slate-700">
                                        <div className="flex items-center"><User className="h-4 w-4 mr-3 text-blue-600" /><span className="font-medium">{selectedIssue.assignedPOC.name}</span></div>
                                        <div className="flex items-center"><span className="h-4 w-4 mr-3 text-center text-blue-600 font-bold">#</span> <span>{selectedIssue.assignedPOC.phone}</span></div>
                                        {selectedIssue.assignedPOC.email && <div className="flex items-center"><span className="h-4 w-4 mr-3 text-center text-blue-600 font-bold">@</span> <span>{selectedIssue.assignedPOC.email}</span></div>}
                                    </div>
                                </div>
                            )}
                        </div>
                         <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                            <Button variant="outline" onClick={closeModals} className="px-6 py-3 rounded-xl border-slate-300 hover:bg-slate-50">Close</Button>
                            <Button onClick={() => { setIsViewModalOpen(false); openAssignModal(selectedIssue); }} className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all">
                                <UserPlus className="h-4 w-4 mr-2" /> Assign POC
                            </Button>
                        </div>
                     </div>
                </motion.div>
             </div>
        )}

        {/* Timeline Modal */}
        {isTimelineModalOpen && selectedIssue && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-green-100"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-800 flex items-center">
                    <Clock className="h-6 w-6 mr-3 text-purple-600" /> Status Timeline
                  </h3>
                  <button onClick={closeModals} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl">
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-lg text-slate-800 mb-2">{selectedIssue.title}</h4>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={`${getPriorityColor(selectedIssue.priority!)} text-sm`}>{selectedIssue.priority}</Badge>
                      {selectedIssue.severityScore && (
                        <Badge className={`${getSeverityColor(selectedIssue.severityScore)} text-sm flex items-center gap-1`}>
                          {getSeverityIcon(selectedIssue.severityScore)}
                          AI: {getSeverityLevel(selectedIssue.severityScore)} ({selectedIssue.severityScore}/10)
                        </Badge>
                      )}
                      <Badge className={`${getStatusColor(selectedIssue.status)} text-sm`}>{selectedIssue.status}</Badge>
                      {selectedIssue.autoRouted && (
                        <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                          <Route className="h-4 w-4 mr-1" />
                          <span>Auto-routed to {selectedIssue.department}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  {selectedIssue.statusTimeline?.map((entry, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          entry.status === 'Reported' ? 'bg-blue-100' :
                          entry.status === 'Auto-Routed' ? 'bg-purple-100' :
                          entry.status === 'In Progress' ? 'bg-yellow-100' :
                          entry.status === 'Resolved' ? 'bg-green-100' :
                          'bg-gray-100'
                        }`}>
                          {entry.status === 'Reported' && <FileText className="h-5 w-5 text-blue-600" />}
                          {entry.status === 'Auto-Routed' && <Route className="h-5 w-5 text-purple-600" />}
                          {entry.status === 'In Progress' && <Activity className="h-5 w-5 text-yellow-600" />}
                          {entry.status === 'Resolved' && <CheckCircle className="h-5 w-5 text-green-600" />}
                          {!['Reported', 'Auto-Routed', 'In Progress', 'Resolved'].includes(entry.status) && 
                            <Clock className="h-5 w-5 text-gray-600" />}
                        </div>
                        {index < (selectedIssue.statusTimeline?.length || 0) - 1 && (
                          <div className="w-0.5 h-8 bg-slate-200 ml-5 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-semibold text-slate-800">{entry.status}</h5>
                          <span className="text-xs text-slate-500">
                            {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">{entry.notes}</p>
                        <p className="text-xs text-slate-500">Updated by: {entry.updatedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedIssue.routingReason && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h5 className="font-semibold text-blue-800 mb-2 flex items-center">
                      <Route className="h-4 w-4 mr-2" /> Auto-Routing Details
                    </h5>
                    <p className="text-sm text-blue-700">{selectedIssue.routingReason}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                  <Button variant="outline" onClick={closeModals} className="px-6 py-3 rounded-xl border-slate-300 hover:bg-slate-50">
                    Close
                  </Button>
                  <Button 
                    onClick={() => { setIsTimelineModalOpen(false); openAssignModal(selectedIssue); }} 
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    <UserPlus className="h-4 w-4 mr-2" /> Assign POC
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
    </div>
  );
};

export default AdminHome;
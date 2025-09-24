import { useEffect, useState } from "react";

// Add CSS for animations
const styles = `
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.6s ease-out forwards;
  }
  
  @keyframes slide-in-left {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .animate-slide-in-left {
    animation: slide-in-left 0.5s ease-out forwards;
  }
  
  @keyframes slide-in-right {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .animate-slide-in-right {
    animation: slide-in-right 0.5s ease-out forwards;
  }
  
  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-scale-in {
    animation: scale-in 0.4s ease-out forwards;
  }
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Separator } from "../components/ui/separator";
import Chatbot from "../components/Chatbot";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Edit,
  Eye,
  Filter,
  Grid,
  List,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  Building,
  BarChart3,
} from "lucide-react";
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { toast } from "sonner";
import { VITE_BACKEND_URL } from "../config/config";

interface Issues {
  _id: string;
  title: string;
  description: string;
  issueType: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdAt: string;
  file?: string;
  status: string;
}

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';

const CitizenProfile = () => {
  // Safely use language context with fallback
  let t: (key: string) => string;
  try {
    const languageContext = useLanguage();
    t = languageContext.t;
  } catch (error) {
    console.warn('Language context not available, using fallback');
    t = (key: string) => key; // Fallback function that returns the key itself
  }

  const { user, updateUserProfile, token, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Enhanced state management
  const [myIssues, setMyIssues] = useState<Issues[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issues[]>([]);
  const [loadingMyIssues, setLoadingMyIssues] = useState(true);
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phonenumber: "",
  });

  // Update profile when user data is available
  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || "",
        email: user.email || "",
        phonenumber: user.phonenumber || "",
      });
    }
  }, [user]);

  // Filter and search logic
  useEffect(() => {
    let filtered = myIssues;
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(issue => issue.status === filterStatus);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(issue => 
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.issueType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredIssues(filtered);
  }, [myIssues, filterStatus, searchTerm]);

  // Show loading state until AuthContext is ready
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-8">
            {/* Enhanced Loading Animation */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-16 h-16 border-4 border-green-200 rounded-full animate-spin"></div>
                <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin absolute"></div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
            </div>
            
            {/* Loading Text with Animation */}
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-4 rounded-full border border-green-200 shadow-lg">
                <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
                <h2 className="text-green-800 text-2xl font-bold">Loading Profile</h2>
              </div>
              <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                Please wait while we securely fetch your profile data...
              </p>
              
 {/* Animated Dots */}
              <div className="flex justify-center space-x-2 mt-6">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-8">
            {/* Enhanced Loading Animation */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-16 h-16 border-4 border-green-200 rounded-full animate-spin"></div>
                <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin absolute"></div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
            </div>
            
            {/* Loading Text with Animation */}
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-4 rounded-full border border-green-200 shadow-lg">
                <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
                <h2 className="text-green-800 text-2xl font-bold">Loading Profile</h2>
              </div>
              <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                Please wait while we securely fetch your profile data...
              </p>
              
              {/* Animated Dots */}
              <div className="flex justify-center space-x-2 mt-6">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile({
        fullName: profile.fullName,
        email: profile.email,
        phonenumber: profile.phonenumber,
      });

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update profile");
    }
  };

  // Fetch issues reported by this user
  useEffect(() => {
    if (!token) return;

    const fetchMyIssues = async () => {
      try {
        setLoadingMyIssues(true);

        const response = await fetch(
          `${VITE_BACKEND_URL}/api/v1/citizen/issues`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          toast.error("Unauthorized! Please log in again.");
          return;
        }

        if (response.ok && Array.isArray(data.issues)) {
          setMyIssues(data.issues);
        } else {
          console.error("Failed to fetch issues:", data.message);
          toast.error(data.message || "Failed to load issues");
        }
      } catch (error) {
        console.error("Error fetching my issues:", error);
        toast.error("Error loading your issues");
      } finally {
        setLoadingMyIssues(false);
      }
    };

    fetchMyIssues();
  }, [token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Rejected":
        return "bg-red-50 text-red-700 border border-red-200";
      case "Pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "Resolved":
        return "bg-green-50 text-green-700 border border-green-200";
      case "In Progress":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Rejected":
        return <XCircle className="h-4 w-4" />;
      case "Pending":
        return <Clock className="h-4 w-4" />;
      case "Resolved":
        return <CheckCircle className="h-4 w-4" />;
      case "In Progress":
        return <PlayCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Function to optimize Cloudinary URLs
  const getOptimizedImageUrl = (originalUrl: string) => {
    if (!originalUrl) return originalUrl;
    
    if (originalUrl.includes('cloudinary.com')) {
      return originalUrl.replace('/upload/', '/upload/w_600,h_400,c_fill,q_auto,f_auto/');
    }
    
    return originalUrl;
  };

  // Handle image loading states
  const handleImageLoad = (issueId: string) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [issueId]: false
    }));
  };

  const handleImageLoadStart = (issueId: string) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [issueId]: true
    }));
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, issueId: string) => {
    const target = e.target as HTMLImageElement;
    
    setImageLoadingStates(prev => ({
      ...prev,
      [issueId]: false
    }));
    
    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTIwSDIyNVYxODBIMTc1VjEyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSI0MCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMjAwIDEzMEMyMTEuMDQ2IDEzMCAyMjAgMTM4Ljk1NCAyMjAgMTUwQzIyMCAxNjEuMDQ2IDIxMS4wNDYgMTcwIDIwMCAxNzBDMTg4Ljk1NCAxNzAgMTgwIDE2MS4wNDYgMTgwIDE1MEMxODAgMTM4Ljk1NCAxODguOTU0IDEzMCAyMDAgMTMwWiIgZmlsbD0id2hpdGUiLz4KPHRleHQgeD0iMjAwIiB5PSIyMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2QjcyODAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+SW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+';
    target.alt = 'Image not available';
  };

  const openImageInNewTab = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  const renderIssueCard = (issue: Issues, index: number) => {
    if (viewMode === 'grid') {
      return (
        <Card key={issue._id} className="group bg-white border-0 shadow-lg hover:shadow-2xl rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 backdrop-blur-sm">
          <div className="relative">
            {issue.file ? (
              <div className="relative h-56 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
                {imageLoadingStates[issue._id] && (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 animate-pulse z-10 flex items-center justify-center">
                    <div className="w-10 h-10 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <img
                  src={getOptimizedImageUrl(issue.file)}
                  alt={`Attachment for ${issue.title}`}
                  className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700 cursor-pointer"
                  onLoadStart={() => handleImageLoadStart(issue._id)}
                  onLoad={() => handleImageLoad(issue._id)}
                  onError={(e) => handleImageError(e, issue._id)}
                  loading="lazy"
                  onClick={() => openImageInNewTab(issue.file!)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
                  <Button size="sm" variant="secondary" className="bg-white/95 hover:bg-white shadow-xl border-0 backdrop-blur-sm rounded-xl px-4 py-2">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-56 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5"></div>
                <div className="relative z-10">
                  <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
                    <FileText className="h-12 w-12 text-green-500" />
                  </div>
                </div>
                <div className="absolute top-2 right-2 w-16 h-16 bg-green-200/20 rounded-full"></div>
                <div className="absolute bottom-2 left-2 w-12 h-12 bg-green-200/20 rounded-full"></div>
              </div>
            )}
            <div className="absolute top-4 left-4 z-10">
              <Badge className={`${getStatusColor(issue.status)} font-bold px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm border-0`}>
                <span className="flex items-center gap-2 text-sm">
                  {getStatusIcon(issue.status)}
                  {issue.status}
                </span>
              </Badge>
            </div>
          </div>
          
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-green-700 transition-colors duration-300 leading-tight">
                {issue.title}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed text-gray-700">
                {issue.description}
              </p>
            </div>
            
            <Separator className="bg-gray-200" />
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="p-2 bg-green-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <span className="line-clamp-1 font-medium">{issue.location.address}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-gray-700">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-medium">{new Date(issue.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700 font-bold px-3 py-1 rounded-lg">
                  {issue.issueType}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    } else {
      return (
        <Card key={issue._id} className="bg-white border-0 shadow-lg hover:shadow-2xl rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex-shrink-0 shadow-lg"></div>
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight group-hover:text-green-700 transition-colors duration-300">{issue.title}</h3>
                </div>
                <p className="text-gray-700 leading-relaxed pl-7 text-lg">{issue.description}</p>
              </div>
              <Badge className={`${getStatusColor(issue.status)} font-bold px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm border-0 ml-6 flex-shrink-0`}>
                <span className="flex items-center gap-2 text-sm">
                  {getStatusIcon(issue.status)}
                  {issue.status}
                </span>
              </Badge>
            </div>

            {issue.file && (
              <div className="mb-8 pl-7">
                <div className="relative group max-w-2xl">
                  {imageLoadingStates[issue._id] && (
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 animate-pulse rounded-2xl flex items-center justify-center z-10">
                      <div className="w-10 h-10 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <img
                    src={getOptimizedImageUrl(issue.file)}
                    alt={`Attachment for ${issue.title}`}
                    className="w-full max-w-2xl h-64 object-cover rounded-2xl border-2 border-gray-100 shadow-lg group-hover:shadow-2xl transition-all duration-500 cursor-pointer"
                    onLoadStart={() => handleImageLoadStart(issue._id)}
                    onLoad={() => handleImageLoad(issue._id)}
                    onError={(e) => handleImageError(e, issue._id)}
                    loading="lazy"
                    onClick={() => openImageInNewTab(issue.file!)}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-2xl transition-all duration-500 flex items-center justify-center cursor-pointer"
                       onClick={() => openImageInNewTab(issue.file!)}>
                    <div className="transform scale-0 group-hover:scale-100 transition-transform duration-300 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl">
                      <Eye className="h-6 w-6 text-gray-700" />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3 italic flex items-center pl-2">
                  <Eye className="h-4 w-4 mr-2" />
                  Click image to view full size
                </p>
              </div>
            )}

            <Separator className="my-6 bg-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-lg pl-7">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-md">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1 text-sm uppercase tracking-wider">Location</p>
                  <p className="text-gray-700 font-medium">{issue.location.address}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-md">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1 text-sm uppercase tracking-wider">Reported On</p>
                  <p className="text-gray-700 font-medium">
                    {new Date(issue.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-md">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1 text-sm uppercase tracking-wider">Issue Type</p>
                  <p className="text-gray-700 font-medium">{issue.issueType}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white">
      {/* Navbar */}
      <HeaderAfterAuth />

      <div className="pt-24 container mx-auto my-8 max-w-7xl space-y-8 px-4">
        {/* Animated Content Container */}
        <div className="space-y-8 animate-fade-in">
        {/* Profile Header */}
        <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden backdrop-blur-sm bg-white/95 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
          <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 h-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
          </div>
          <CardHeader className="relative pb-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-sm opacity-75 animate-pulse"></div>
                  <Avatar className="h-28 w-28 border-4 border-white shadow-2xl -mt-16 bg-gradient-to-br from-green-50 to-emerald-50 relative z-10">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="text-3xl font-bold text-green-800 bg-gradient-to-br from-green-100 to-emerald-100">
                      {profile.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-3">
                  <CardTitle className="text-3xl font-bold text-gray-900 tracking-tight">
                    {profile.fullName}
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 inline-flex">
                    <Building className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Citizen Profile Dashboard</span>
                  </CardDescription>
                </div>
              </div>
              <Button
                variant={isEditing ? "default" : "outline"}
                size="lg"
                className={`
                  ${isEditing
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                    : "border-2 border-green-600 text-green-700 hover:bg-green-50 hover:border-green-700 hover:shadow-md transform hover:scale-105"
                  } transition-all duration-300 font-semibold px-8 py-3 rounded-xl backdrop-blur-sm`}
                onClick={
                  isEditing ? handleSaveProfile : () => setIsEditing(true)
                }
              >
                <Edit className="h-5 w-5 mr-2" />
                {isEditing ? "Save Changes" : "Edit Profile"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-10 pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              <div className="space-y-4">
                <Label htmlFor="name" className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1 h-4 bg-green-600 rounded-full"></div>
                  Full Name
                </Label>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                    <User className="h-6 w-6 text-green-700" />
                  </div>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={profile.fullName}
                      onChange={(e) =>
                        setProfile({ ...profile, fullName: e.target.value })
                      }
                      className="border-2 border-gray-200 focus:border-green-500 focus:ring-green-200 text-lg px-4 py-3 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"
                    />
                  ) : (
                    <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 min-w-[200px]">
                      <span className="text-lg font-semibold text-gray-800">{profile.fullName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="email" className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1 h-4 bg-green-600 rounded-full"></div>
                  Email Address
                </Label>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                    <Mail className="h-6 w-6 text-green-700" />
                  </div>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      className="border-2 border-gray-200 focus:border-green-500 focus:ring-green-200 text-lg px-4 py-3 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"
                    />
                  ) : (
                    <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 min-w-[200px]">
                      <span className="text-lg font-semibold text-gray-800">{profile.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="phone" className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1 h-4 bg-green-600 rounded-full"></div>
                  Phone Number
                </Label>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                    <Phone className="h-6 w-6 text-green-700" />
                  </div>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={profile.phonenumber}
                      onChange={(e) =>
                        setProfile({ ...profile, phonenumber: e.target.value })
                      }
                      className="border-2 border-gray-200 focus:border-green-500 focus:ring-green-200 text-lg px-4 py-3 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"
                    />
                  ) : (
                    <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 min-w-[200px]">
                      <span className="text-lg font-semibold text-gray-800">{profile.phonenumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
          <Card className="bg-gradient-to-br from-slate-50 to-white border-0 shadow-lg hover:shadow-2xl rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 group">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full -mr-10 -mt-10 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="text-4xl font-bold text-slate-800 mb-3 group-hover:text-slate-900 transition-colors duration-300">
                    {myIssues.length}
                  </div>
                  <p className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                    Total Issues
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <FileText className="h-8 w-8 text-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white border-0 shadow-lg hover:shadow-2xl rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 group">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full -mr-10 -mt-10 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="text-4xl font-bold text-green-700 mb-3 group-hover:text-green-800 transition-colors duration-300">
                    {myIssues.filter((issue) => issue.status === "Resolved").length}
                  </div>
                  <p className="text-sm font-bold text-green-600 uppercase tracking-wider">
                    Resolved
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-lg hover:shadow-2xl rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 group">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200 to-sky-300 rounded-full -mr-10 -mt-10 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="text-4xl font-bold text-blue-700 mb-3 group-hover:text-blue-800 transition-colors duration-300">
                    {myIssues.filter((issue) => issue.status === "In Progress").length}
                  </div>
                  <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">
                    In Progress
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-100 to-sky-100 rounded-2xl shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <PlayCircle className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-white border-0 shadow-lg hover:shadow-2xl rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 group">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full -mr-10 -mt-10 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="text-4xl font-bold text-amber-700 mb-3 group-hover:text-amber-800 transition-colors duration-300">
                    {myIssues.filter((issue) => issue.status === "Pending").length}
                  </div>
                  <p className="text-sm font-bold text-amber-600 uppercase tracking-wider">
                    Pending
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Issues Section */}
        <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 border-0 text-white px-10 py-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
                <div className="flex items-center space-x-6">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold text-white tracking-tight">My Reported Issues</CardTitle>
                    <CardDescription className="text-green-100 text-xl mt-2 font-medium">
                      Track and monitor all your reported issues
                    </CardDescription>
                  </div>
                </div>
                
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
                  <div className="relative flex-1 lg:flex-initial">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5" />
                    <Input
                      placeholder="Search issues..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/70 focus:bg-white/30 focus:border-white/50 focus:ring-white/20 rounded-xl py-3 text-lg"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`p-3 transition-all duration-300 rounded-lg ${
                        viewMode === 'grid' 
                          ? 'bg-white text-green-700 shadow-md' 
                          : 'text-white/90 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <Grid className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`p-3 transition-all duration-300 rounded-lg ${
                        viewMode === 'list' 
                          ? 'bg-white text-green-700 shadow-md' 
                          : 'text-white/90 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <List className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-4 mt-8">
                <div className="flex items-center space-x-3 text-white/90 font-medium">
                  <Filter className="h-5 w-5" />
                  <span className="text-lg">Filter by status:</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(['all', 'Pending', 'In Progress', 'Resolved', 'Rejected'] as const).map((status) => (
                    <Button
                      key={status}
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilterStatus(status)}
                      className={`px-5 py-2.5 text-sm font-bold transition-all duration-300 rounded-xl backdrop-blur-sm ${
                        filterStatus === status
                          ? 'bg-white text-green-700 shadow-lg transform scale-105'
                          : 'text-white/90 bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/50'
                      }`}
                    >
                      {status === 'all' ? 'All Issues' : status}
                      {status !== 'all' && (
                        <Badge className={`ml-3 text-xs px-2 py-1 rounded-full ${
                          filterStatus === status ? 'bg-green-100 text-green-800' : 'bg-white/20 text-white'
                        }`}>
                          {myIssues.filter((issue) => issue.status === status).length}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-10">
            {loadingMyIssues ? (
              <div className="text-center py-24">
                {/* Enhanced Issues Loading Animation */}
                <div className="relative mx-auto mb-12">
                  <div className="w-32 h-32 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-emerald-100 opacity-50"></div>
                    <div className="w-24 h-24 border-4 border-green-200 rounded-full animate-spin"></div>
                    <div className="w-24 h-24 border-4 border-green-600 border-t-transparent rounded-full animate-spin absolute"></div>
                    <div className="absolute inset-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-green-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="absolute -top-4 -right-4 w-6 h-6 bg-emerald-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                  <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                </div>
                
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-4 rounded-full border border-green-200 shadow-lg">
                    <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
                    <h3 className="text-green-800 text-2xl font-bold">Loading Your Issues</h3>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed px-4">
                    Please wait while we fetch your reported issues...
                  </p>
                  <div className="flex justify-center space-x-2 mt-6">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-24">
                {/* Enhanced Empty State Animation */}
                <div className="relative mx-auto mb-12">
                  <div className="w-32 h-32 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden border border-slate-200">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-slate-100/40"></div>
                    <div className="relative z-10">
                      <FileText className="h-16 w-16 text-slate-400" />
                    </div>
                    
                    {/* Floating Decorative Elements */}
                    <div className="absolute top-4 right-4 w-10 h-10 bg-slate-200/40 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 bg-slate-200/40 rounded-full animate-pulse" style={{ animationDelay: '500ms' }}></div>
                    <div className="absolute top-1/2 left-2 w-4 h-4 bg-slate-300/30 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                    <div className="absolute top-1/3 right-2 w-3 h-3 bg-slate-300/30 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                  </div>
                  
                  {/* Outer Glow Effect */}
                  <div className="absolute -inset-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                </div>
                
                <div className="space-y-8 max-w-3xl mx-auto">
                  <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-4 rounded-full border border-slate-200 shadow-lg">
                    <div className="w-3 h-3 bg-slate-600 rounded-full animate-pulse"></div>
                    <h3 className="text-slate-800 text-2xl font-bold">
                      {searchTerm || filterStatus !== 'all' ? 'No Issues Found' : 'No Issues Reported Yet'}
                    </h3>
                  </div>
                  
                  <p className="text-gray-600 text-lg leading-relaxed px-6">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try adjusting your search terms or filters to find what you\'re looking for. We\'re here to help you locate the issues you need.'
                      : 'You haven\'t reported any issues yet. Start by reporting your first issue to help improve your community and make a difference where you live.'
                    }
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                    {(searchTerm || filterStatus !== 'all') && (
                      <Button 
                        onClick={() => {
                          setSearchTerm('');
                          setFilterStatus('all');
                        }}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                      >
                        <Filter className="h-5 w-5" />
                        Clear Filters
                      </Button>
                    )}
                    
                    {!searchTerm && filterStatus === 'all' && (
                      <Button 
                        onClick={() => {
                          // Navigate to report issue page - this would need to be implemented
                          window.location.href = '/citizen/report-issue';
                        }}
                        className="bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                      >
                        <FileText className="h-5 w-5" />
                        Report Your First Issue
                      </Button>
                    )}
                  </div>
                  
                  {/* Helpful Tips */}
                  <div className="mt-12 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 max-w-2xl mx-auto">
                    <h4 className="text-green-800 font-bold text-lg mb-3 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span>Pro Tip</span>
                    </h4>
                    <p className="text-green-700 text-sm leading-relaxed">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try using broader search terms or selecting different status filters to see more results.'
                        : 'Reporting issues helps your community identify and solve problems faster. Every report makes a difference!'
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Results Summary */}
                <div className="flex items-center justify-between mb-10 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-green-800 font-bold text-lg">
                        Showing {filteredIssues.length} of {myIssues.length} issues
                      </p>
                      {(searchTerm || filterStatus !== 'all') && (
                        <p className="text-green-600 text-sm mt-1 font-medium">
                          {searchTerm && `Search: "${searchTerm}"`}
                          {searchTerm && filterStatus !== 'all' && ' • '}
                          {filterStatus !== 'all' && `Filter: ${filterStatus}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl font-bold shadow-md">
                    {viewMode === 'grid' ? 'Grid View' : 'List View'}
                  </Badge>
                </div>

                {/* Issues Display */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredIssues.map((issue, index) => (
                      <div 
                        key={issue._id} 
                        className="animate-scale-in" 
                        style={{ animationDelay: `${0.1 + (index * 0.1)}s` }}
                      >
                        {renderIssueCard(issue, index)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredIssues.map((issue, index) => (
                      <div 
                        key={issue._id} 
                        className="animate-slide-in-left" 
                        style={{ animationDelay: `${0.1 + (index * 0.1)}s` }}
                      >
                        {renderIssueCard(issue, index)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default CitizenProfile;
import { useEffect, useState } from "react";
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
    fullName: user?.fullName || "",
    email: user?.email || "",
    phonenumber: user?.phonenumber || "",
  });

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
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-200 rounded-full animate-spin"></div>
              <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <div className="space-y-2">
              <p className="text-green-800 text-xl font-semibold">Loading Profile</p>
              <p className="text-green-600">Please wait while we fetch your data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-200 rounded-full animate-spin"></div>
              <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <div className="space-y-2">
              <p className="text-green-800 text-xl font-semibold">Loading Profile</p>
              <p className="text-green-600">Please wait while we fetch your data...</p>
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
        <Card key={issue._id} className="group bg-white border border-gray-200 shadow-sm hover:shadow-lg rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1">
          <div className="relative">
            {issue.file ? (
              <div className="relative h-48 overflow-hidden">
                {imageLoadingStates[issue._id] && (
                  <div className="absolute inset-0 bg-green-50 animate-pulse z-10 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <img
                  src={getOptimizedImageUrl(issue.file)}
                  alt={`Attachment for ${issue.title}`}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                  onLoadStart={() => handleImageLoadStart(issue._id)}
                  onLoad={() => handleImageLoad(issue._id)}
                  onError={(e) => handleImageError(e, issue._id)}
                  loading="lazy"
                  onClick={() => openImageInNewTab(issue.file!)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white shadow-sm border-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                <FileText className="h-12 w-12 text-green-400" />
              </div>
            )}
            <div className="absolute top-3 left-3">
              <Badge className={`${getStatusColor(issue.status)} font-medium px-2.5 py-1 rounded-md`}>
                <span className="flex items-center gap-1.5 text-xs">
                  {getStatusIcon(issue.status)}
                  {issue.status}
                </span>
              </Badge>
            </div>
          </div>
          
          <CardContent className="p-5 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-700 transition-colors duration-200">
                {issue.title}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                {issue.description}
              </p>
            </div>
            
            <Separator className="bg-gray-200" />
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="line-clamp-1">{issue.location.address}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span>{new Date(issue.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                  {issue.issueType}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    } else {
      return (
        <Card key={issue._id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md rounded-lg overflow-hidden transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0"></div>
                  <h3 className="text-xl font-semibold text-gray-900">{issue.title}</h3>
                </div>
                <p className="text-gray-700 leading-relaxed pl-5">{issue.description}</p>
              </div>
              <Badge className={`${getStatusColor(issue.status)} font-medium px-3 py-1.5 rounded-md ml-4 flex-shrink-0`}>
                <span className="flex items-center gap-1.5 text-sm">
                  {getStatusIcon(issue.status)}
                  {issue.status}
                </span>
              </Badge>
            </div>

            {issue.file && (
              <div className="mb-6 pl-5">
                <div className="relative group max-w-md">
                  {imageLoadingStates[issue._id] && (
                    <div className="absolute inset-0 bg-green-50 animate-pulse rounded-lg flex items-center justify-center z-10">
                      <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <img
                    src={getOptimizedImageUrl(issue.file)}
                    alt={`Attachment for ${issue.title}`}
                    className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-300 cursor-pointer"
                    onLoadStart={() => handleImageLoadStart(issue._id)}
                    onLoad={() => handleImageLoad(issue._id)}
                    onError={(e) => handleImageError(e, issue._id)}
                    loading="lazy"
                    onClick={() => openImageInNewTab(issue.file!)}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-300 flex items-center justify-center cursor-pointer"
                       onClick={() => openImageInNewTab(issue.file!)}>
                    <div className="transform scale-0 group-hover:scale-100 transition-transform duration-200 bg-white rounded-lg p-3 shadow-md">
                      <Eye className="h-5 w-5 text-gray-700" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 italic flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  Click to view full size
                </p>
              </div>
            )}

            <Separator className="my-4 bg-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pl-5">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Location</p>
                  <p className="text-gray-600">{issue.location.address}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Reported On</p>
                  <p className="text-gray-600">
                    {new Date(issue.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Issue Type</p>
                  <p className="text-gray-600">{issue.issueType}</p>
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
        {/* Profile Header */}
        <Card className="bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-100 to-green-50 h-24"></div>
          <CardHeader className="relative pb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24 border-4 border-white shadow-md -mt-12 bg-green-50">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-2xl font-semibold text-green-700 bg-green-100">
                    {profile.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold text-gray-900">
                    {profile.fullName}
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 flex items-center gap-2">
                    <Building className="w-5 h-5 text-green-600" />
                    Citizen Profile Dashboard
                  </CardDescription>
                </div>
              </div>
              <Button
                variant={isEditing ? "default" : "outline"}
                size="lg"
                className={`${
                  isEditing
                    ? "bg-green-700 hover:bg-green-800 text-white shadow-md"
                    : "border-green-700 text-green-700 hover:bg-green-50"
                } transition-all duration-200 font-medium px-6`}
                onClick={
                  isEditing ? handleSaveProfile : () => setIsEditing(true)
                }
              >
                <Edit className="h-5 w-5 mr-2" />
                {isEditing ? "Save Changes" : "Edit Profile"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Full Name
                </Label>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <User className="h-5 w-5 text-green-700" />
                  </div>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={profile.fullName}
                      onChange={(e) =>
                        setProfile({ ...profile, fullName: e.target.value })
                      }
                      className="border-gray-300 focus:border-green-600 focus:ring-green-200 text-lg"
                    />
                  ) : (
                    <span className="text-lg font-medium text-gray-800">{profile.fullName}</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Email Address
                </Label>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Mail className="h-5 w-5 text-green-700" />
                  </div>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      className="border-gray-300 focus:border-green-600 focus:ring-green-200 text-lg"
                    />
                  ) : (
                    <span className="text-lg font-medium text-gray-800">{profile.email}</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Phone Number
                </Label>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Phone className="h-5 w-5 text-green-700" />
                  </div>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={profile.phonenumber}
                      onChange={(e) =>
                        setProfile({ ...profile, phonenumber: e.target.value })
                      }
                      className="border-gray-300 focus:border-green-600 focus:ring-green-200 text-lg"
                    />
                  ) : (
                    <span className="text-lg font-medium text-gray-800">{profile.phonenumber}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-white border border-gray-200 shadow-sm hover:shadow-md rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {myIssues.length}
                  </div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Total Issues
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-700 mb-2">
                    {myIssues.filter((issue) => issue.status === "Resolved").length}
                  </div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Resolved
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {myIssues.filter((issue) => issue.status === "In Progress").length}
                  </div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    In Progress
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <PlayCircle className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-amber-700 mb-2">
                    {myIssues.filter((issue) => issue.status === "Pending").length}
                  </div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Pending
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Issues Section */}
        <Card className="bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-100 to-green-50 border-b border-green-200 text-gray-800 px-8 py-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <FileText className="h-6 w-6 text-green-700" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-green-900">My Reported Issues</CardTitle>
                  <CardDescription className="text-green-800 text-lg mt-1">
                    Track and monitor all your reported issues
                  </CardDescription>
                </div>
              </div>
              
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600/80 h-4 w-4" />
                  <Input
                    placeholder="Search issues..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-green-300 text-green-900 placeholder:text-green-600/80 focus:bg-white focus:border-green-500"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-green-600/20 text-green-800' 
                        : 'text-green-700/80 hover:bg-green-600/10 hover:text-green-800'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-green-600/20 text-green-800' 
                        : 'text-green-700/80 hover:bg-green-600/10 hover:text-green-800'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <div className="flex items-center space-x-2 text-green-800/80">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filter by status:</span>
              </div>
              {(['all', 'Pending', 'In Progress', 'Resolved', 'Rejected'] as const).map((status) => (
                <Button
                  key={status}
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    filterStatus === status
                      ? 'bg-green-700 text-white'
                      : 'text-green-800 bg-white hover:bg-green-600/10 border border-green-300'
                  }`}
                >
                  {status === 'all' ? 'All Issues' : status}
                  {status !== 'all' && (
                    <Badge className={`ml-2 text-xs px-1.5 py-0.5 ${
                      filterStatus === status ? 'bg-white/30 text-white' : 'bg-green-100 text-green-800'
                    }`}>
                      {myIssues.filter((issue) => issue.status === status).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            {loadingMyIssues ? (
              <div className="text-center py-16">
                <div className="relative mx-auto mb-6">
                  <div className="w-16 h-16 border-4 border-green-200 rounded-full animate-spin"></div>
                  <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                </div>
                <div className="space-y-2">
                  <p className="text-green-700 text-xl font-semibold">Loading Your Issues</p>
                  <p className="text-gray-600">Please wait while we fetch your reported issues...</p>
                </div>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {searchTerm || filterStatus !== 'all' ? 'No Issues Found' : 'No Issues Reported Yet'}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                      : 'You haven\'t reported any issues yet. Start by reporting your first issue to help improve your community.'
                    }
                  </p>
                  {(searchTerm || filterStatus !== 'all') && (
                    <Button 
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                      }}
                      className="bg-green-700 hover:bg-green-800 text-white px-6 py-2"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                {/* Results Summary */}
                <div className="flex items-center justify-between mb-8 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-800 font-medium">
                        Showing {filteredIssues.length} of {myIssues.length} issues
                      </p>
                      {(searchTerm || filterStatus !== 'all') && (
                        <p className="text-xs text-green-600 mt-0.5">
                          {searchTerm && `Search: "${searchTerm}"`}
                          {searchTerm && filterStatus !== 'all' && ' • '}
                          {filterStatus !== 'all' && `Filter: ${filterStatus}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-green-600 text-white px-3 py-1">
                    {viewMode === 'grid' ? 'Grid View' : 'List View'}
                  </Badge>
                </div>

                {/* Issues Display */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredIssues.map((issue, index) => renderIssueCard(issue, index))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredIssues.map((issue, index) => renderIssueCard(issue, index))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CitizenProfile;
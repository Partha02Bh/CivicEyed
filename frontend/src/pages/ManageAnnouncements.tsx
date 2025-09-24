import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { VITE_BACKEND_URL } from "../config/config";
import { 
  Megaphone, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Bell,
  Eye,
  Edit,
  Trash2,
  Plus,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import HeaderAfterAuth from '../components/HeaderAfterAuth';

interface Announcement {
  _id: string;
  title: string;
  description: string;
  location: string;
  pincode: string;
  category: 'Emergency' | 'Maintenance' | 'General' | 'Festival' | 'Traffic' | 'Utility';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  scheduledDate?: string;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

interface PaginationInfo {
  current: number;
  pages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const ManageAnnouncements: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [pincodeFilter, setPincodeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  });

  const categories = ['All', 'General', 'Emergency', 'Maintenance', 'Festival', 'Traffic', 'Utility'];
  const priorities = ['All', 'Low', 'Medium', 'High', 'Critical'];

  // Redirect if not admin
  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedPriority !== 'All') params.append('priority', selectedPriority);
      if (pincodeFilter) params.append('pincode', pincodeFilter);

      const response = await fetch(`${VITE_BACKEND_URL}/api/v1/announcements?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setAnnouncements(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch announcements:', data.message);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [currentPage, searchTerm, selectedCategory, selectedPriority, pincodeFilter]);

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${VITE_BACKEND_URL}/api/v1/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Announcement deleted successfully!');
        fetchAnnouncements(); // Refresh the list
      } else {
        alert(data.message || 'Failed to delete announcement');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement. Please try again.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'Maintenance': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Traffic': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Festival': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Utility': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Emergency': return <AlertTriangle className="h-4 w-4" />;
      case 'Maintenance': return <Clock className="h-4 w-4" />;
      case 'Traffic': return <MapPin className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedPriority('All');
    setPincodeFilter('');
    setCurrentPage(1);
  };

  return (
    <>
      <HeaderAfterAuth />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 via-transparent to-teal-100/20" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/15 rounded-full blur-3xl animate-pulse-slower" />
        
        <div className="relative z-10 p-6 pt-24">
          <div className="container mx-auto max-w-7xl">
            {/* Enhanced Header with Breadcrumb */}
            <div className="mb-12">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center space-x-2 text-sm text-slate-600 mb-6">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/admin')}
                  className="text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg px-3 py-1 transition-all duration-300"
                >
                  Admin Dashboard
                </Button>
                <span>/</span>
                <span className="text-emerald-600 font-medium">Manage Announcements</span>
              </nav>
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-2xl animate-float">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2 leading-tight">
                    Manage Announcements
                  </h1>
                  <p className="text-lg text-slate-600">
                    View, edit, and manage all community announcements
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => navigate('/admin/create-announcement')}
                className="px-8 py-4 text-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white shadow-2xl hover:shadow-3xl rounded-2xl transition-all duration-500 hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create New Announcement
              </Button>
            </div>

            {/* Enhanced Filters */}
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-2">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                          placeholder="Search announcements..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-12 h-14 text-base border-slate-300 focus:border-emerald-500 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="h-14 border-slate-300 focus:border-emerald-500 rounded-xl">
                          <div className="flex items-center space-x-2">
                            <Filter className="h-5 w-5" />
                            <SelectValue placeholder="Category" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                        <SelectTrigger className="h-14 border-slate-300 focus:border-emerald-500 rounded-xl">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetFilters}
                      className="text-slate-600 border-slate-300 hover:bg-slate-50 rounded-xl px-6 py-3"
                    >
                      Clear Filters
                    </Button>
                    <div className="text-base text-slate-600 font-medium">
                      Showing {announcements.length} of {pagination.total} announcements
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Announcements List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg text-slate-600">Loading announcements...</p>
              </div>
            </div>
          ) : announcements.length === 0 ? (
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md">
              <CardContent className="p-16 text-center">
                <Megaphone className="h-20 w-20 text-slate-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-700 mb-4">No Announcements Found</h3>
                <p className="text-lg text-slate-500 mb-8">There are no announcements matching your current filters.</p>
                <Button
                  onClick={() => navigate('/admin/create-announcement')}
                  className="px-8 py-4 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl rounded-2xl"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Announcement
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {announcements.map((announcement, index) => (
                <Card 
                  key={announcement._id} 
                  className="shadow-2xl border-0 bg-white/90 backdrop-blur-md hover:shadow-3xl transition-all duration-500 group animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-6 lg:space-y-0">
                      <div className="flex-1 space-y-6">
                        {/* Header with Actions */}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors duration-300">
                                {announcement.title}
                              </h3>
                              {!announcement.isActive && (
                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <Badge className={`px-3 py-1 border ${getCategoryColor(announcement.category)}`}>
                                <div className="flex items-center space-x-1">
                                  {getCategoryIcon(announcement.category)}
                                  <span className="font-medium">{announcement.category}</span>
                                </div>
                              </Badge>
                              <Badge className={`px-3 py-1 border ${getPriorityColor(announcement.priority)}`}>
                                {announcement.priority}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 rounded-xl"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 rounded-xl"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAnnouncement(announcement._id)}
                              className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 rounded-xl"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-slate-700 leading-relaxed text-lg">
                          {announcement.description}
                        </p>

                        {/* Location & Date Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                              <MapPin className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-600">Location</p>
                              <p className="text-slate-900 font-semibold text-lg">{announcement.location}</p>
                              <p className="text-sm text-slate-500">Pincode: {announcement.pincode}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-100 rounded-xl">
                              <Calendar className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-600">Published</p>
                              <p className="text-slate-900 font-semibold text-lg">{formatDate(announcement.createdAt)}</p>
                              <p className="text-sm text-slate-500">By: {announcement.createdBy.name}</p>
                            </div>
                          </div>
                        </div>

                        {/* Schedule Information */}
                        {(announcement.scheduledDate || announcement.expiryDate) && (
                          <div className="bg-slate-50 rounded-xl p-6 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {announcement.scheduledDate && (
                                <div>
                                  <p className="text-sm font-medium text-slate-600 mb-2">Scheduled Date</p>
                                  <p className="text-slate-900 font-semibold">{formatDate(announcement.scheduledDate)}</p>
                                </div>
                              )}
                              {announcement.expiryDate && (
                                <div>
                                  <p className="text-sm font-medium text-slate-600 mb-2">Expires On</p>
                                  <p className="text-slate-900 font-semibold">{formatDate(announcement.expiryDate)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-12">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.pages - 4, currentPage - 2)) + i;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-3 rounded-xl ${pageNum === currentPage ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNext}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default ManageAnnouncements;

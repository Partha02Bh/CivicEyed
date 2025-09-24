import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  Megaphone, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  AlertTriangle,
  Clock,
  Hash,
  ChevronLeft,
  ChevronRight,
  Bell
} from 'lucide-react';
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

const Announcements: React.FC = () => {
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

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedPriority !== 'All') params.append('priority', selectedPriority);
      if (pincodeFilter) params.append('pincode', pincodeFilter);

      const response = await fetch(`/api/v1/announcements?${params}`);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAnnouncements();
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
            {/* Enhanced Header */}
            <div className="mb-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-2xl mb-6 animate-float">
                  <Megaphone className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4 leading-tight">
                  Announcements & Broadcasts
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  Stay updated with important community notices and official announcements from local authorities
                </p>
              </div>

          {/* Filters */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        placeholder="Search announcements..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 border-slate-300 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-12 border-slate-300 focus:border-emerald-500">
                        <div className="flex items-center space-x-2">
                          <Filter className="h-4 w-4" />
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
                      <SelectTrigger className="h-12 border-slate-300 focus:border-emerald-500">
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

                  <div>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        placeholder="Pincode"
                        value={pincodeFilter}
                        onChange={(e) => setPincodeFilter(e.target.value)}
                        className="pl-10 h-12 border-slate-300 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetFilters}
                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                  >
                    Clear Filters
                  </Button>
                  <div className="text-sm text-slate-600">
                    Showing {announcements.length} of {pagination.total} announcements
                  </div>
                </div>
              </form>
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
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Megaphone className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Announcements Found</h3>
              <p className="text-slate-500">There are no announcements matching your current filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {announcements.map((announcement, index) => (
              <Card 
                key={announcement._id} 
                className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1 space-y-4">
                      {/* Header */}
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors duration-300">
                            {announcement.title}
                          </h3>
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
                      </div>

                      {/* Description */}
                      <p className="text-slate-700 leading-relaxed text-lg">
                        {announcement.description}
                      </p>

                      {/* Location & Date Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <MapPin className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">Location</p>
                            <p className="text-slate-900 font-semibold">{announcement.location}</p>
                            <p className="text-sm text-slate-500">Pincode: {announcement.pincode}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">Published</p>
                            <p className="text-slate-900 font-semibold">{formatDate(announcement.createdAt)}</p>
                            <p className="text-sm text-slate-500">By: {announcement.createdBy.name}</p>
                          </div>
                        </div>
                      </div>

                      {/* Schedule Information */}
                      {(announcement.scheduledDate || announcement.expiryDate) && (
                        <div className="bg-slate-50 rounded-lg p-4 mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {announcement.scheduledDate && (
                              <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Scheduled Date</p>
                                <p className="text-slate-900">{formatDate(announcement.scheduledDate)}</p>
                              </div>
                            )}
                            {announcement.expiryDate && (
                              <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Expires On</p>
                                <p className="text-slate-900">{formatDate(announcement.expiryDate)}</p>
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
          <div className="flex justify-center items-center space-x-4 mt-8">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="flex items-center space-x-2"
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
                    className={pageNum === currentPage ? "bg-emerald-600 hover:bg-emerald-700" : ""}
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
              className="flex items-center space-x-2"
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

export default Announcements;

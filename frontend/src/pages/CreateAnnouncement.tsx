import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { 
  Megaphone, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Save, 
  ArrowLeft,
  Clock,
  Hash
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import HeaderAfterAuth from '../components/HeaderAfterAuth';

interface AnnouncementData {
  title: string;
  description: string;
  location: string;
  pincode: string;
  category: string;
  priority: string;
  scheduledDate: string;
  expiryDate: string;
}

const CreateAnnouncement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AnnouncementData>({
    title: '',
    description: '',
    location: '',
    pincode: '',
    category: 'General',
    priority: 'Medium',
    scheduledDate: '',
    expiryDate: ''
  });

  // Redirect if not admin
  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleInputChange = (field: keyof AnnouncementData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          scheduledDate: formData.scheduledDate || null,
          expiryDate: formData.expiryDate || null
        })
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        alert('Announcement created successfully!');
        navigate('/admin');
      } else {
        alert(data.message || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    'General',
    'Emergency',
    'Maintenance', 
    'Festival',
    'Traffic',
    'Utility'
  ];

  const priorities = [
    'Low',
    'Medium',
    'High',
    'Critical'
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Emergency': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'Maintenance': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'Traffic': return <MapPin className="h-4 w-4 text-orange-500" />;
      default: return <Megaphone className="h-4 w-4 text-green-500" />;
    }
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
          <div className="container mx-auto max-w-5xl">
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
                <span className="text-emerald-600 font-medium">Create Announcement</span>
              </nav>
              
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-2xl mb-6 animate-float">
                  <Megaphone className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4 leading-tight">
                  Create Announcement
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  Broadcast important information to citizens and keep your community informed with professional announcements
                </p>
              </div>
            </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Basic Information */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md hover:shadow-3xl transition-all duration-500 group animate-fade-in">
            <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-t-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardTitle className="flex items-center space-x-3 relative z-10 text-xl font-bold">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Megaphone className="h-6 w-6" />
                </div>
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title" className="text-base font-semibold text-slate-700">
                    Notice Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Water Supply Disruption"
                    required
                    className="mt-2 h-12 text-base border-slate-300 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-base font-semibold text-slate-700">
                    Category *
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="mt-2 h-12 text-base border-slate-300 focus:border-emerald-500">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(formData.category)}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(category)}
                            <span>{category}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority" className="text-base font-semibold text-slate-700">
                    Priority *
                  </Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger className="mt-2 h-12 text-base border-slate-300 focus:border-emerald-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(priority)}`}>
                            {priority}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description" className="text-base font-semibold text-slate-700">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Provide detailed information about the announcement..."
                    required
                    rows={4}
                    className="mt-2 text-base border-slate-300 focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md hover:shadow-3xl transition-all duration-500 group animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-t-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardTitle className="flex items-center space-x-3 relative z-10 text-xl font-bold">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <MapPin className="h-6 w-6" />
                </div>
                <span>Location Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="location" className="text-base font-semibold text-slate-700">
                    Location Name *
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Sector 21, Bangalore"
                    required
                    className="mt-2 h-12 text-base border-slate-300 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <Label htmlFor="pincode" className="text-base font-semibold text-slate-700">
                    Pincode *
                  </Label>
                  <div className="relative mt-2">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      placeholder="560021"
                      required
                      pattern="[1-9][0-9]{5}"
                      maxLength={6}
                      className="pl-10 h-12 text-base border-slate-300 focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">6-digit Indian pincode</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md hover:shadow-3xl transition-all duration-500 group animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white rounded-t-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardTitle className="flex items-center space-x-3 relative z-10 text-xl font-bold">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Calendar className="h-6 w-6" />
                </div>
                <span>Schedule Information (Optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="scheduledDate" className="text-base font-semibold text-slate-700">
                    Scheduled Date & Time
                  </Label>
                  <Input
                    id="scheduledDate"
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                    className="mt-2 h-12 text-base border-slate-300 focus:border-emerald-500"
                  />
                  <p className="text-sm text-slate-500 mt-1">When this announcement applies</p>
                </div>

                <div>
                  <Label htmlFor="expiryDate" className="text-base font-semibold text-slate-700">
                    Expiry Date & Time
                  </Label>
                  <Input
                    id="expiryDate"
                    type="datetime-local"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className="mt-2 h-12 text-base border-slate-300 focus:border-emerald-500"
                  />
                  <p className="text-sm text-slate-500 mt-1">When this announcement expires</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Submit Button Section */}
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin')}
              className="px-10 py-4 text-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 rounded-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm bg-white/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="px-12 py-4 text-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white shadow-2xl hover:shadow-3xl rounded-2xl transition-all duration-500 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-5 w-5" />
                  <span>Create Announcement</span>
                </div>
              )}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
    </>
  );
};

export default CreateAnnouncement;

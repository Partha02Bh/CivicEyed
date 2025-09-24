import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card.tsx";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import { Label } from "../components/ui/label.tsx";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../components/ui/avatar.tsx";
import { Separator } from "../components/ui/separator.tsx";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  FileText,
  Edit,
  Shield,
  CheckCircle,
  MapPin,
  Clock,
  BarChart3,
  ListChecks,
  Search,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { toast } from "sonner";
import { VITE_BACKEND_URL } from "../config/config.tsx";
import HeaderAfterAuth from "../components/HeaderAfterAuth";

// Define the shape of an Issue object for TypeScript
interface Issues {
  _id: string;
  title: string;
  description: string;
  issueType: string;
  location: { address: string };
  createdAt: string;
  status: string;
  resolvedDate?: string | null;
  reportDate?: string;
  category?: string;      // This field must be provided by the backend API
  citizenName?: string;   // This field must be provided by the backend API
  adminResponse?: string;
}

const AdminProfile = () => {
  const { user, updateUserProfile, token, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [respondedIssues, setRespondedIssues] = useState<Issues[]>([]);
  const [loadingMyIssues, setLoadingMyIssues] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [profile, setProfile] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phonenumber: user?.phonenumber || "",
    department: user?.department || "",
  });

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || "",
        email: user.email || "",
        phonenumber: user.phonenumber || "",
        department: user.department || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;
    const fetchMyIssues = async () => {
      setLoadingMyIssues(true);
      try {
        const response = await fetch(`${VITE_BACKEND_URL}/api/v1/admin/handled-issues`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch issues");
        const data = await response.json();
        // The backend response at data.issues MUST include 'citizenName' and 'category' for each issue.
        setRespondedIssues(data.issues || []);
      } catch (error) {
        toast.error("Could not load your issues.");
      } finally {
        setLoadingMyIssues(false);
      }
    };
    fetchMyIssues();
  }, [token]);

  // Use useMemo to efficiently filter issues only when dependencies change
  const filteredIssues = useMemo(() => {
    return respondedIssues
      .filter((issue) => {
        if (activeFilter === "All") return true;
        return issue.status === activeFilter;
      })
      .filter((issue) =>
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (issue.citizenName && issue.citizenName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [respondedIssues, searchTerm, activeFilter]);

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(profile);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile.");
    }
  };

  const stats = useMemo(() => {
    const total = respondedIssues.length;
    const resolved = respondedIssues.filter((issue) => issue.status === "Resolved").length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return {
      total,
      resolved,
      inProgress: respondedIssues.filter((issue) => issue.status === "In Progress").length,
      resolutionRate,
    };
  }, [respondedIssues]);

  if (isLoading || loadingMyIssues) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <p className="text-muted-foreground">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-emerald-50">
      <HeaderAfterAuth />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-800">Administrator Profile</h1>
          <p className="text-zinc-500 mt-1">Manage your details and track your handled issues.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-8">
            <Card className="bg-white/70 backdrop-blur-sm border-zinc-200/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="text-xl bg-emerald-100 text-emerald-700 font-semibold">
                      {profile.fullName.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl text-zinc-800">{profile.fullName}</CardTitle>
                    <CardDescription>Official</CardDescription>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="rounded-full" onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}>
                  {isEditing ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <Edit className="h-5 w-5 text-zinc-500" />}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  icon={User}
                  label="Full Name"
                  value={profile.fullName}
                  isEditing={isEditing}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setProfile({ ...profile, fullName: e.target.value })
                  }
                />
                <InfoRow icon={Mail} label="Email" value={profile.email} isEditing={isEditing} onChange={(e: React.ChangeEvent<HTMLInputElement>)  => setProfile({ ...profile, email: e.target.value })} type="email" />
                <InfoRow icon={Phone} label="Phone" value={profile.phonenumber} isEditing={isEditing} onChange={(e: React.ChangeEvent<HTMLInputElement>)  => setProfile({ ...profile, phonenumber: e.target.value })} />
                <InfoRow icon={Briefcase} label="Department" value={profile.department} isEditing={isEditing} onChange={(e: React.ChangeEvent<HTMLInputElement>)  => setProfile({ ...profile, department: e.target.value })} />
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-zinc-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-zinc-800">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  <span>Activity Snapshot</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <StatItem label="Handled" value={stats.total} />
                  <StatItem label="Resolved" value={stats.resolved} />
                  <StatItem label="In Progress" value={stats.inProgress} />
                </div>
                <div>
                  <Label className="text-xs text-zinc-500">Resolution Rate</Label>
                  <div className="w-full bg-zinc-200 rounded-full h-2.5 mt-1">
                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${stats.resolutionRate}%` }}></div>
                  </div>
                  <p className="text-right text-sm font-bold text-emerald-600 mt-1">{stats.resolutionRate}%</p>
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-zinc-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-zinc-800">Handled Issues Log</CardTitle>
                <CardDescription>Search and filter through all issues you've managed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input placeholder="Search by title or citizen name..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  {['All', 'Resolved', 'In Progress', 'Pending', 'Rejected'].map(status => (
                    <FilterButton key={status} status={status} activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {filteredIssues.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-zinc-700 font-semibold text-lg">No Matching Issues Found</p>
                <p className="text-sm text-zinc-500">Try adjusting your search or filter.</p>
              </div>
            ) : (
              filteredIssues.map((issue) => <IssueItem key={issue._id} issue={issue} />)
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- Helper & Sub-Components ---

const InfoRow = ({ icon: Icon, label, value, isEditing, onChange, type = "text" }: any) => (
  <div className="border-b border-zinc-200/80 pb-2">
    <Label className="text-xs text-zinc-500 font-medium">{label}</Label>
    <div className="flex items-center gap-3 text-sm text-zinc-800 mt-1">
      <Icon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
      {isEditing ? (
        <Input type={type} value={value} onChange={onChange} className="h-8 bg-white/50" />
      ) : (
        <span className="truncate">{value || <span className="text-zinc-400">Not provided</span>}</span>
      )}
    </div>
  </div>
);

const StatItem = ({ label, value }: any) => (
  <div>
    <p className="text-2xl font-bold text-emerald-600">{value}</p>
    <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
  </div>
);

const FilterButton = ({ status, activeFilter, setActiveFilter }: any) => {
  const isActive = status === activeFilter;
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={() => setActiveFilter(status)}
      className={`transition-all duration-200 ${isActive ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-white/50 hover:bg-white text-zinc-600 border-zinc-200'}`}
    >
      {status}
    </Button>
  );
};

const getStatusClasses = (status: string) => {
  switch (status) {
    case "Resolved": return { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" };
    case "In Progress": return { icon: Shield, color: "text-teal-600", bg: "bg-teal-50" };
    case "Pending": return { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" };
    case "Rejected": return { icon: X, color: "text-red-600", bg: "bg-red-50" };
    default: return { icon: ListChecks, color: "text-zinc-600", bg: "bg-zinc-50" };
  }
};

const IssueItem = ({ issue }: { issue: Issues }) => {
  const statusInfo = getStatusClasses(issue.status);
  return (
    <Card className="bg-white/70 backdrop-blur-sm border-zinc-200/60 hover:border-emerald-300 transition-all duration-300 group shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-lg text-zinc-800">{issue.title}</CardTitle>
            <CardDescription className="mt-1">
              By <span className="font-medium text-zinc-600">{issue.citizenName || 'N/A'}</span>
            </CardDescription>
          </div>
          <div className={`flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-full ${statusInfo.color} ${statusInfo.bg}`}>
            <statusInfo.icon className="h-3.5 w-3.5" />
            <span>{issue.status}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-zinc-600 leading-relaxed">{issue.description}</p>
        {issue.adminResponse && (
          <div className="bg-emerald-50/80 border-l-4 border-emerald-400 p-3 rounded-r-md">
            <p className="text-sm text-emerald-900"><strong className="font-semibold">Response:</strong> {issue.adminResponse}</p>
          </div>
        )}
        <Separator className="bg-zinc-200/80" />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
          <MetaItem icon={MapPin} text={issue.location?.address} />
          <MetaItem icon={Calendar} text={`Reported: ${issue.reportDate ? new Date(issue.reportDate).toLocaleDateString() : 'N/A'}`} />
          <MetaItem icon={FileText} text={issue.category || 'N/A'} />
        </div>
      </CardContent>
    </Card>
  );
};

const MetaItem = ({ icon: Icon, text }: any) => (
  <div className="flex items-center gap-2">
    <Icon className="h-4 w-4 text-zinc-400" />
    <span>{text}</span>
  </div>
);

export default AdminProfile;
import { Link } from "react-router-dom";
import { Button } from "./ui/button.tsx";
import { LogIn, LogOut, Shield, LayoutDashboard, Menu, X, Settings } from "lucide-react";
import civicIssueLogo from "../assets/civic-issue.png";
import { useAuth } from "../contexts/AuthContext.tsx";
import { useState } from "react";

type HeaderProps = {
  onFeaturesClick?: () => void;
  onHowItWorksClick?: () => void;
};

const HeaderAfterAuth: React.FC<HeaderProps> = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-green-200/50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 group-hover:from-green-200 group-hover:to-emerald-200 transition-all duration-300 shadow-sm">
              <img src={civicIssueLogo} alt="CivicEye Logo" className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                CivicEye
              </h1>
              <p className="text-xs text-green-600/80 font-medium">
                Building Better Communities
              </p>
            </div>
          </Link>

          {/* Desktop User Section */}
          <div className="hidden lg:flex items-center space-x-6">
            {user ? (
              <>
                {/* User Info */}
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      {user?.fullName ? user.fullName : "Guest User"}
                    </p>
                    <p className="text-xs text-green-600 capitalize font-medium">
                      {user.role} Dashboard
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "G"}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <Link to={user.role === "citizen" ? "/citizen" : "/admin"}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-300 shadow-sm"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  
                  <Link to={user.role === "citizen" ? "/citizen/profile" : "/admin/profile"}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-sm"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  </Link>

                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-300"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors duration-300"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-green-200/50 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              {user ? (
                <>
                  {/* Mobile User Info */}
                  <div className="flex items-center space-x-4 px-4 py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold shadow-lg">
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "G"}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-800">
                        {user?.fullName ? user.fullName : "Guest User"}
                      </p>
                      <p className="text-sm text-green-600 capitalize font-medium">
                        {user.role} Account
                      </p>
                    </div>
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="space-y-3">
                    <Link to={user.role === "citizen" ? "/citizen" : "/admin"} onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md">
                        <LayoutDashboard className="h-4 w-4 mr-3" />
                        Go to Dashboard
                      </Button>
                    </Link>
                    
                    <Link to={user.role === "citizen" ? "/citizen/profile" : "/admin/profile"} onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Profile Settings
                      </Button>
                    </Link>

                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full justify-start border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <Link to="/signin" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <LogIn className="h-4 w-4 mr-3" />
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                      <Shield className="h-4 w-4 mr-3" />
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderAfterAuth;

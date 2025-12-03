import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavbarChatIcon from "@/components/NavbarChatIcon";
import Cookies from "js-cookie";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!Cookies.get("goldenNileToken"));
  const [userPhoto, setUserPhoto] = useState<string | null>(
    Cookies.get("goldenNileUserPhoto") || null
  );

  const token = Cookies.get("goldenNileToken");

  /** Decode JWT safely */
  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = atob(base64Url.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(base64);
    } catch {
      return null;
    }
  };

  /** Fetch user photo once */
  const fetchUserPhotoOnce = async () => {
    if (!token) return;
    if (userPhoto !== null) return; // Already loaded (cached)

    const payload = decodeToken(token);
    if (!payload?.id) return;

    try {
      const res = await fetch(`http://localhost:8000/api/user/${payload.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success && data.data?.photo) {
        const photoUrl = `http://localhost:8000${data.data.photo}`;
        setUserPhoto(photoUrl);
        Cookies.set("goldenNileUserPhoto", photoUrl); // cache 
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  /* Run once on first load */
  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
      fetchUserPhotoOnce();
    }
  }, []);

  /** Listen for login/logout without re-fetching on navigation */
  useEffect(() => {
    const handleAuthUpdate = () => {
      const newToken = Cookies.get("goldenNileToken");

      setIsLoggedIn(!!newToken);

      if (!newToken) {
        setUserPhoto(null);
        Cookies.remove("goldenNileUserPhoto");
      } else {
        // Fetch ONLY once after login
        fetchUserPhotoOnce();
      }
    };

    window.addEventListener("authChange", handleAuthUpdate);
    window.addEventListener("storage", handleAuthUpdate);

    return () => {
      window.removeEventListener("authChange", handleAuthUpdate);
      window.removeEventListener("storage", handleAuthUpdate);
    };
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Booking", path: "/booking" },
    { name: "Trip Plan", path: "/trip" },
    { name: "Community", path: "/community" },
    { name: "Blogs", path: "/blogs" },
  ];

  
  return (
    <nav className="fixed top-0 w-full bg-background/70 backdrop-blur-sm border-b border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
<Link
  to="/"
  className="flex flex-row items-center gap-3 px-5 py-2  "
>
  {/* اللوجو */}
  <img
    src="/favicon.ico"
    alt="Golden Nile Logo"
    className="w-10 h-10 object-contain drop-shadow-md"
  />

  {/* النص */}
  <span className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-sm">
    Golden Nile
  </span>
</Link>




          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-foreground/80 hover:text-primary font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <NavbarChatIcon />
                <Link to="/profile" className="flex items-center gap-2">
                  {userPhoto ? (
                    <img
                      src={userPhoto}
                      alt="Profile"
                      className="h-9 w-9 rounded-full border-2 border-primary shadow-sm"
                    />
                  ) : (
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="h-5 w-5" />
                    </Button>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button>Register</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button className="lg:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-4 animate-fade-in">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="px-4 py-2 text-foreground/80 hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              <div className="px-4 pt-4 border-t space-y-4">
                {isLoggedIn && (
                  <div className="flex justify-end">
                    <NavbarChatIcon />
                  </div>
                )}
                {isLoggedIn ? (
                  <Link to="/profile">
                    <Button variant="outline" className="w-full">Profile</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link to="/auth">
                      <Button className="w-full">Register</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </nav>
  );
};

export default Navbar;
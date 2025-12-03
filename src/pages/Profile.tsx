import { useEffect, useMemo, useState, useCallback } from "react";
import { User, MapPin, Calendar, DollarSign, Clock, CheckCircle, XCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import Cookies from "js-cookie";
import api from "@/interceptor/api";
import { programApi } from "@/services/api";

type Booking = {
  _id: string;
  place?: { name?: string; address?: string; type?: string; latitude?: number; longitude?: number };
  arrivalDate?: string;
  leavingDate?: string;
  memberNumber?: number;
  roomNumber?: number;
  destination?: string;
  budget?: number;
  duration?: number;
  interesting?: string;
  date?: string | Date;
  status?: "confirmed" | "pending" | "canceled";
  totalPrice?: number;
  bookingTime?: string;
  bookingDay?: string;
  bookingType?: string;
  guestTypes?: any;
  createdAt?:Date
};

const getBookingStatus = (arrivalDate: string, leavingDate: string, placeType: string, bookingTime?: string) => {
  const now = new Date();
  const arrival = new Date(arrivalDate);
  const leaving = leavingDate ? new Date(leavingDate) : null;

  if (placeType === "restaurant") {
    // For restaurants, check if the reservation date/time has passed
    if (bookingTime) {
      // Combine date and time for restaurants
      const [hours, minutes] = bookingTime.split(':').map(Number);
      arrival.setHours(hours, minutes, 0, 0);
    }

    if (now < arrival) return "Waiting";
    if (now >= arrival) return "Finished";
    return "Waiting";
  }

  // For guest houses
  if (!leaving) return "Waiting";

  if (now < arrival) return "Waiting";
  if (now >= arrival && now <= leaving) return "Running";
  if (now > leaving) return "Finished";

  return "Waiting";
};

type ProfileData = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photo?: string;
};

const Profile = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Open program modal when navigated here with a programId in location.state
  useEffect(() => {
    const state = (location as any).state;
    const programId = state?.programId;
    if (programId) {
      (async () => {
        try {
          const res = await programApi.getProgram(programId);
          const programData = (res as any).data?.data || (res as any).data || res;
          setSelectedProgram(programData);
          setSelectedActivityIndex(0);
          setProgramModalOpen(true);
        } catch (err) {
          console.error('Failed to load program from location state', err);
        }
      })();
    }
  }, [location]);
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState("overview");
   const [profile, setProfile] = useState<ProfileData | null>(null);
   const [bookings, setBookings] = useState<Booking[]>([]);
  const [userPrograms, setUserPrograms] = useState<any[]>([]);
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [selectedActivityIndex, setSelectedActivityIndex] = useState<number>(0);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [programToConfirmDelete, setProgramToConfirmDelete] = useState<any | null>(null);
   const [uploading, setUploading] = useState(false);
   const [userData, setUserData] = useState<any>({});

   // Photo upload states
   const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
   const [photoPreview, setPhotoPreview] = useState<string | null>(null);
   const [photoUploadLoading, setPhotoUploadLoading] = useState(false);
   const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

   // Booking modal states
   const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
   const [bookingModalOpen, setBookingModalOpen] = useState(false);

   // Editable profile fields
   const [editFirstName, setEditFirstName] = useState("");
   const [editLastName, setEditLastName] = useState("");
   const [editEmail, setEditEmail] = useState("");
   const [editPhone, setEditPhone] = useState("");

   // User info from token
   const [userInfo, setUserInfo] = useState<{
     id: string;
     email: string;
     firstName: string;
     lastName: string;
     gender: string;
     photo?: string;
   } | null>(null);

  const token = Cookies.get("goldenNileToken");

  // Decode token to get user info
  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Invalid token:", error);
      return null;
    }
  };

  const payload = useMemo(() => {
    if (!token) return null;
    return decodeToken(token);
  }, [token]);
  const { toast } = useToast();

  const defaultAvatar = useMemo(() => {
    const seed = profile?.email || profile?.firstName || "User";
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  }, [profile]);

  // fetch user data and save to state - always runs on page refresh (mount)
  const fetchAndSaveUserData = async (id: string) => {
    try {
      const res = await api.get(`/api/user/${id}`);
      const data = res?.data || null;
      if (data) {
        // Construct full photo URL if photo exists
        if (data.photo) {
          data.photo = `http://localhost:8000${data.photo}`;
        }
        setUserData(data);
        return data;
      }
      return null;
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      return null;
    }
  };

  // Fetch user places on mount and ensure userData is fetched & used
  useEffect(() => {
    const token = Cookies.get("goldenNileToken");
    if (!token) {
      navigate("/auth");
      return;
    }

    const payload = decodeToken(token);
    if (!payload?.id) {
      navigate("/auth");
      return;
    }

    (async () => {
      // Load from localStorage first for immediate display
      try {
        const storedData = localStorage.getItem("goldenNileUserData");
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setUserData(parsedData);
          setUserInfo({
            id: payload.id,
            email: payload.email,
            firstName: parsedData?.firstName || payload.firstName || "firstname",
            lastName: parsedData?.lastName || payload.lastName || "lastname",
            gender: parsedData?.gender || payload.gender || "male",
            photo: parsedData?.photo || "",
          });
        }
      } catch (e) {
        console.error("Error loading from localStorage:", e);
      }

      // Always fetch latest user data on refresh/mount
      const data = await fetchAndSaveUserData(payload.id);
      // Update userInfo with fresh data
      setUserInfo({
        id: payload.id,
        email: payload.email,
        firstName: data?.firstName || payload.firstName || "firstname",
        lastName: data?.lastName || payload.lastName || "lastname",
        gender: data?.gender || payload.gender || "male",
        photo: data?.photo || "",
      });

      // Fetch bookings
      try {
        const userId = payload?.id;
        if (userId) {
          const resBookings = await api.get(`/api/booking/user/${userId}`);
          const d = (resBookings as any).data || resBookings;
          setBookings(d.data || d);
        }
      } catch (e) {
        // silently ignore; Guard handles redirects for unauthenticated
      }

      // Fetch saved programs
      try {
        const userId = payload?.id;
        if (userId) {
          const resPrograms = await programApi.getProgramsByUser(userId);
          const programs = (resPrograms as any).data || resPrograms;
          setUserPrograms(programs.data || programs);
        }
      } catch (e) {
        console.error("Failed to fetch user programs:", e);
      }

    })();
  }, [navigate]);
      console.log(payload);


  // Refresh bookings when a new booking is made
  const refreshBookings = useCallback(async () => {
    const userId = payload?.id;
    if (userId) {
      try {
        const resBookings = await api.get(`/api/booking/user/${userId}`);
        const d = (resBookings as any).data || resBookings;
        setBookings(d.data || d);
      } catch (e) {
        console.error("Failed to refresh bookings:", e);
      }
    }
  }, [payload?.id]);

  // Refresh user's saved programs
  const refreshPrograms = useCallback(async () => {
    const userId = payload?.id;
    if (!userId) return;
    try {
      const resPrograms = await programApi.getProgramsByUser(userId);
      const programs = (resPrograms as any).data || resPrograms;
      setUserPrograms(programs.data || programs);
    } catch (e) {
      console.error('Failed to refresh programs', e);
    }
  }, [payload?.id]);

  // ProgramMap component for showing single activity marker
  const ProgramMap = ({ activities, selectedIndex }: { activities: any[]; selectedIndex: number }) => {
    const map = useMap();
    const selectedActivity = activities[selectedIndex];
    const coords = selectedActivity ? (() => {
      const lat = Number(selectedActivity.latitude || selectedActivity.lat);
      const lng = Number(selectedActivity.longitude || selectedActivity.lng);
      if (!isNaN(lat) && !isNaN(lng)) return [[lat, lng] as [number, number]];
      return [];
    })() : [];

    // Center map on selected activity
    useEffect(() => {
      if (coords.length === 0) return;
      try {
        map.invalidateSize();
        map.setView(coords[0], 13);
      } catch (e) {
        // ignore
      }
    }, [selectedIndex, activities]);

    return (
      <>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        {coords.map((c, i) => (
          <Marker key={selectedIndex} position={c as [number, number]}>
            <Popup>{selectedActivity?.name}</Popup>
          </Marker>
        ))}
      </>
    );
  };

  // Listen for booking creation and deletion events
  useEffect(() => {
    const handleBookingCreated = () => {
      refreshBookings();
    };

    const handleBookingDeleted = () => {
      refreshBookings();
    };

    const handleProgramCreated = () => {
      refreshPrograms();
    };

    const handleProgramDeleted = () => {
      refreshPrograms();
    };

    window.addEventListener('bookingCreated', handleBookingCreated);
    window.addEventListener('bookingDeleted', handleBookingDeleted);
    window.addEventListener('programCreated', handleProgramCreated);
    window.addEventListener('programDeleted', handleProgramDeleted);

    return () => {
      window.removeEventListener('bookingCreated', handleBookingCreated);
      window.removeEventListener('bookingDeleted', handleBookingDeleted);
      window.removeEventListener('programCreated', handleProgramCreated);
      window.removeEventListener('programDeleted', handleProgramDeleted);
    };
  }, [payload?.id, refreshBookings, refreshPrograms]);

  // Refresh programs when Programs tab becomes active or when user changes
  useEffect(() => {
    if (activeTab !== "programs") return;
    (async () => {
      try {
        const userId = payload?.id;
        if (!userId) return;
        const resPrograms = await programApi.getProgramsByUser(userId);
        const programs = (resPrograms as any).data || resPrograms;
        setUserPrograms(programs.data || programs);
      } catch (err) {
        console.error("Failed to refresh programs:", err);
      }
    })();
  }, [activeTab, payload?.id]);

  // Populate edit states when userData loads
  useEffect(() => {
    if (userData) {
      setEditFirstName(userData.firstName || "");
      setEditLastName(userData.lastName || "");
      setEditEmail(userData.email || "");
      setEditPhone(userData.phone || "");
    }
  }, [userData]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setPhotoUploadError("Please select a valid image file.");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setPhotoUploadError("Image file is too large. Please choose an image under 5MB.");
        return;
      }

      // Clear any previous errors
      setPhotoUploadError(null);

      setSelectedPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    } catch (error) {
      console.error("Error handling photo upload:", error);
      setPhotoUploadError("Error selecting photo. Please try again.");
    }
  };

  const uploadPhoto = async () => {
    if (!selectedPhoto) return;

    setPhotoUploadLoading(true);
    setPhotoUploadError(null);

    const formData = new FormData();
    formData.append("photo", selectedPhoto);

    try {
      console.log("Sending photo upload request...");
      console.log("FormData contents:", formData);

      const res = await api.post("/api/user/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Upload response:", res);

      if ((res as any).photo) {
        // Construct full URL for the uploaded photo
        const fullPhotoUrl = `http://localhost:8000${(res as any).photo}`;
        console.log("Full photo URL:", fullPhotoUrl);
        setUserData((prev: any) => {
          const updatedData = {
            ...prev,
            photo: fullPhotoUrl || prev.photo || "",
          };
          // Update localStorage with new photo
          try {
            localStorage.setItem("goldenNileUserData", JSON.stringify(updatedData));
          } catch (e) {
            console.error("Error updating localStorage:", e);
          }
          return updatedData;
        });
        setSelectedPhoto(null);
        setPhotoPreview(null);
        // Update navbar cookie
        Cookies.set("goldenNileUserPhoto", fullPhotoUrl);
        // Clear the file input
        const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        console.error("No photo in response:", res);
        throw new Error("No photo URL returned from server");
      }
    } catch (err: any) {
      console.error("Error uploading photo:", err);
      console.error("Full error object:", JSON.stringify(err, null, 2));

      let errorMessage = "Failed to upload photo. Please try again.";

      if (err?.response) {
        const status = err.response.status;
        const data = err.response.data;
        console.error("Response status:", status);
        console.error("Response data:", data);

        switch (status) {
          case 400:
            errorMessage = data?.message || "Invalid file format or size.";
            break;
          case 401:
            errorMessage = "You are not authorized. Please log in again.";
            break;
          case 413:
            errorMessage = "File is too large. Please choose a smaller image.";
            break;
          case 415:
            errorMessage = "Unsupported file type. Please choose a valid image file.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          default:
            errorMessage = data?.message || err.message || errorMessage;
        }
      } else if (err?.request) {
        console.error("Request error - no response received");
        errorMessage = "Network error. Please check your connection and try again.";
      } else {
        console.error("Other error:", err.message);
        errorMessage = err.message || errorMessage;
      }

      setPhotoUploadError(errorMessage);
    } finally {
      setPhotoUploadLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const updatedData = {
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
        phone: editPhone,
      };
      const res = await api.put(`/api/user/${userInfo?.id}`, updatedData);
      if (res.data.success) {
        // Update userData
        setUserData(res.data.data);
        // Update localStorage
        localStorage.setItem("goldenNileUserData", JSON.stringify(res.data.data));
        // Update userInfo
        setUserInfo(prev => prev ? {
          ...prev,
          firstName: res.data.data.firstName,
          lastName: res.data.data.lastName,
          email: res.data.data.email,
        } : null);
        // Update navbar cookie if email changed
        if (res.data.data.email !== userInfo?.email) {
          Cookies.set("goldenNileUserEmail", res.data.data.email);
        }
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      // Optionally show error message
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Waiting":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Running":
        return "text-green-600 bg-green-50 border-green-200";
      case "Finished":
        return "text-red-600 bg-red-50 border-red-200";
      case "confirmed":
        return "text-green-600 bg-green-50 border-green-200";
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "canceled":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Waiting":
        return <Clock className="h-5 w-5" />;
      case "Running":
        return <CheckCircle className="h-5 w-5" />;
      case "Finished":
        return <XCircle className="h-5 w-5" />;
      case "confirmed":
        return <CheckCircle className="h-5 w-5" />;
      case "pending":
        return <Loader className="h-5 w-5" />;
      case "canceled":
        return <XCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-muted/20 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <Card className="overflow-hidden shadow-lg">
                <div className="bg-gradient-to-br from-primary to-secondary p-6 text-center">
                  <img

                    src={userData?.photo || userData?.photo || defaultAvatar}
                    alt={userData ? `${userData.firstName} ${userData.lastName}` : "User"}
                    className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg"

                    // src={photoPreview || userData?.photo || (userInfo ? `https://api.dicebear.com/7.x/${userInfo.gender === "female" ? "personas" : "personas"}/svg?seed=${userInfo.firstName}${userInfo.lastName}` : "https://api.dicebear.com/7.x/personas/svg?seed=User")}
                    // alt={userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : "User"}
                    // className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://api.dicebear.com/7.x/personas/svg?seed=User";
                    }}

                  />
                  <h2 className="text-xl font-bold text-white mb-1">{userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : "Loading..."}</h2>
                  <p className="text-white/90 text-sm">{userInfo?.email || "Loading..."}</p>
                </div>
                <CardContent className="p-0">
                  <nav className="flex flex-col">
                    <button
                      onClick={() => setActiveTab("overview")}
                      className={`px-6 py-4 text-left transition-colors border-l-4 ${
                        activeTab === "overview"
                          ? "border-primary bg-primary/5 text-primary font-semibold"
                          : "border-transparent hover:bg-muted"
                      }`}
                    >
                      Profile Overview
                    </button>
                    <button
                      onClick={() => setActiveTab("bookings")}
                      className={`px-6 py-4 text-left transition-colors border-l-4 ${
                        activeTab === "bookings"
                          ? "border-primary bg-primary/5 text-primary font-semibold"
                          : "border-transparent hover:bg-muted"
                      }`}
                    >
                      My Bookings
                    </button>
                    <button
                      onClick={() => setActiveTab("programs")}
                      className={`px-6 py-4 text-left transition-colors border-l-4 ${
                        activeTab === "programs"
                          ? "border-primary bg-primary/5 text-primary font-semibold"
                          : "border-transparent hover:bg-muted"
                      }`}
                    >
                      Programs
                    </button>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className={`px-6 py-4 text-left transition-colors border-l-4 ${
                        activeTab === "settings"
                          ? "border-primary bg-primary/5 text-primary font-semibold"
                          : "border-transparent hover:bg-muted"
                      }`}
                    >
                      Settings
                    </button>
                   <button
                    onClick={() => {
                      Cookies.remove("goldenNileToken");
                      navigate("/");
                      window.location.reload(); // Force Navbar to update
                    }}
                    className="px-6 py-4 text-left border-l-4 border-transparent hover:bg-muted text-destructive w-full text-left"
                  >
                    Log Out
                  </button>
                  </nav>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3">
              {activeTab === "overview" && (
                <div className="animate-fade-in">
                  <h1 className="text-3xl font-bold mb-6">Profile Overview</h1>
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Full Name</label>
                      <p className="font-medium">{userData ? `${userData.firstName} ${userData.lastName}` : "-"}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Email</label>
                      <p className="font-medium">{userData?.email}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Phone</label>
                      <p className="font-medium">{userData?.phone || "-"}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Member Since</label>
                          <p className="font-medium">{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "-"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl font-bold text-primary mb-2">
                          {bookings.length}
                        </div>
                        <p className="text-muted-foreground">Total Trips</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl font-bold text-primary mb-2">
                          {bookings.filter(t => t.status === "confirmed").length}
                        </div>
                        <p className="text-muted-foreground">Confirmed</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl font-bold text-primary mb-2">
                          {bookings.filter(t => t.status === "pending").length}
                        </div>
                        <p className="text-muted-foreground">Pending</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "programs" && (
                <div className="animate-fade-in">
                  <h1 className="text-3xl font-bold mb-6">My Saved Programs</h1>
                  {userPrograms.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No saved programs yet</h3>
                        <p className="text-muted-foreground mb-6">Generate a travel program and save it from the Trip Planner.</p>
                        <Link to="/trip">
                          <Button>Open Trip Planner</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      {userPrograms.map((prog: any, idx: number) => (
                        <Card key={prog._id || idx} className="hover:shadow-lg overflow-hidden">
                          <CardContent className="p-6 flex flex-col md:flex-row justify-between gap-4 items-center">
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold">{prog.name}</h3>
                              <p className="text-sm text-muted-foreground">{prog.destination} • {prog.activities?.length || 0} activities</p>
                              <p className="text-sm mt-2 text-muted-foreground">{prog.checkInDate} to {prog.checkOutDate}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" onClick={async () => {
                                try {
                                  const res = await programApi.getProgram(prog._id);
                                  const programData = (res as any).data?.data || (res as any).data || res;
                                  setSelectedProgram(programData);
                                  setSelectedActivityIndex(0);
                                  setProgramModalOpen(true);
                                } catch (err) {
                                  console.error('Failed to fetch program', err);
                                  toast({ title: 'Error', description: 'Failed to load program details.' });
                                }
                              }}>View</Button>
                              <Button onClick={async() => {
                                await api.delete(`/api/program/${prog._id}`)
                                setProgramToConfirmDelete(prog);
                                setConfirmDeleteOpen(true);
                              }} variant="destructive">Delete</Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "bookings" && (
                <div className="animate-fade-in">
                  <h1 className="text-3xl font-bold mb-6">My Bookings</h1>
                  {bookings.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No trips yet</h3>
                        <p className="text-muted-foreground mb-6">
                          You haven't booked any trips yet. Explore more adventures!
                        </p>
                        <Link to="/booking">
                          <Button>Browse Trips</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      {bookings.map((trip, index) => (
                      <Card
                        key={(trip as any)._id || index}
                        className="overflow-hidden hover:shadow-lg transition-shadow animate-slide-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                            <div>
                              <h3 className="text-2xl font-bold mb-2">{trip.place?.name || trip.destination || "Trip"}</h3>
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(getBookingStatus(trip.arrivalDate || "", trip.leavingDate || "", trip.place?.type || "guest_house", (trip as any).bookingTime))}`}>
                                {getStatusIcon(getBookingStatus(trip.arrivalDate || "", trip.leavingDate || "", trip.place?.type || "guest_house", (trip as any).bookingTime))}
                                <span>{getBookingStatus(trip.arrivalDate || "", trip.leavingDate || "", trip.place?.type || "guest_house", (trip as any).bookingTime)}</span>
                              </div>
                            </div>
                            <div className="mt-4 md:mt-0">
                              <span className="text-2xl font-bold text-primary">${trip.totalPrice || "N/A"}</span>
                            </div>
                          </div>

                          {/* Booking Information Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 text-primary" />
                              <div>
                                <div className="font-medium text-foreground">{trip.place?.address || "N/A"}</div>
                                <div className="text-xs">Location</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4 text-primary" />
                              <div>
                                <div className="font-medium text-foreground">{trip.memberNumber || "N/A"}</div>
                                <div className="text-xs">{trip.place?.type === "restaurant" ? "Tables" : "Guests"}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4 text-primary" />
                              <div>
                                <div className="font-medium text-foreground">
                                  {trip.place?.type === "restaurant" && trip.bookingDay
                                    ? new Date(trip.bookingDay).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : trip.arrivalDate
                                    ? new Date(trip.arrivalDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : (trip.date ? new Date(trip.date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }) : "N/A")}
                                </div>
                                <div className="text-xs">{trip.place?.type === "restaurant" ? "Reservation Date" : "Check-in"}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4 text-primary" />
                              <div>
                                <div className="font-medium text-foreground">
                                  {trip.place?.type === "restaurant" && trip.bookingTime
                                    ? trip.bookingTime
                                    : trip.leavingDate
                                    ? new Date(trip.leavingDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : "N/A"}
                                </div>
                                <div className="text-xs">{trip.place?.type === "restaurant" ? "Time" : "Check-out"}</div>
                              </div>
                            </div>
                          </div>

                          {/* Additional Info for Guest Houses */}
                          {trip.place?.type === "guest_house" && trip.roomNumber && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedBooking(trip);
                                setBookingModalOpen(true);
                              }}
                            >
                              View Details
                            </Button>
                            </div>
                          )}

                          {/* Additional Info for Restaurants */}
                          {trip.place?.type === "restaurant" && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <div className="flex justify-start mb-3">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedBooking(trip);
                                    setBookingModalOpen(true);
                                  }}
                                >
                                  View Details
                                </Button>
                              </div>

                            </div>
                          )}

                        </CardContent>
                      </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "settings" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Settings</h1>
                  </div>
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
                          <div className="flex items-center gap-6">
                            <div className="relative">
                              <img
                                src={photoPreview || userData?.photo || (userInfo ? `https://api.dicebear.com/7.x/${userInfo.gender === "female" ? "personas" : "personas"}/svg?seed=${userInfo.firstName}${userInfo.lastName}` : "https://api.dicebear.com/7.x/personas/svg?seed=User")}
                                alt="Profile"
                                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://api.dicebear.com/7.x/personas/svg?seed=User";
                                }}
                              />
                              <label
                                htmlFor="photo-upload"
                                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                              >
                                <User className="w-4 h-4" />
                              </label>
                              <input
                                id="photo-upload"
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="hidden"
                              />
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Change Profile Picture</h4>
                              <p className="text-sm text-muted-foreground mb-4">
                                Upload a new profile picture. Recommended size: 400x400px
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => document.getElementById('photo-upload')?.click()}
                                >
                                  Choose File
                                </Button>
                                {selectedPhoto && (
                                  <Button onClick={uploadPhoto} disabled={photoUploadLoading}>
                                    {photoUploadLoading ? "Uploading..." : "Upload Photo"}
                                  </Button>
                                )}
                              </div>
                              {selectedPhoto && (
                                <p className="text-sm text-green-600 mt-2">
                                  Selected: {selectedPhoto.name}
                                </p>
                              )}
                              {photoUploadError && (
                                <p className="text-sm text-red-600 mt-2">
                                  Error: {photoUploadError}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-6">
                          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">First Name</label>
                              <Input
                                value={editFirstName}
                                onChange={(e) => setEditFirstName(e.target.value)}
                                placeholder="First Name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Last Name</label>
                              <Input
                                value={editLastName}
                                onChange={(e) => setEditLastName(e.target.value)}
                                placeholder="Last Name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Email</label>
                              <Input
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                placeholder="Email"
                                type="email"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Phone Number</label>
                              <Input
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                placeholder="Phone Number"
                              />
                            </div>
                          </div>
                          <div className="mt-6">
                            <Button variant="outline" onClick={handleUpdateProfile}>
                              Update Changes
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Booking Details</DialogTitle>
            <DialogDescription>
              Complete information about your booking
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Status and Basic Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{selectedBooking.place?.name || "Booking"}</h3>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(getBookingStatus(selectedBooking.arrivalDate || "", selectedBooking.leavingDate || "", selectedBooking.place?.type || "guest_house", (selectedBooking as any).bookingTime))}`}>
                        {getStatusIcon(getBookingStatus(selectedBooking.arrivalDate || "", selectedBooking.leavingDate || "", selectedBooking.place?.type || "guest_house", (selectedBooking as any).bookingTime))}
                        <span>{getBookingStatus(selectedBooking.arrivalDate || "", selectedBooking.leavingDate || "", selectedBooking.place?.type || "guest_house", (selectedBooking as any).bookingTime)}</span>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <span className="text-2xl font-bold text-primary">${selectedBooking.totalPrice || "N/A"}</span>
                    </div>
                  </div>

                  {/* Booking Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{selectedBooking.place?.address || "N/A"}</div>
                        <div className="text-xs">Location</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{selectedBooking.memberNumber || "N/A"}</div>
                        <div className="text-xs">{selectedBooking.place?.type === "restaurant" ? "Tables" : "Guests"}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">
                           {selectedBooking.place?.type === "restaurant" && selectedBooking.bookingDay
                                    ? new Date(selectedBooking.bookingDay).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : selectedBooking.arrivalDate
                                    ? new Date(selectedBooking.arrivalDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : (selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }) : "N/A")}
                        </div>
                        <div className="text-xs">{selectedBooking.place?.type === "restaurant" ? "Reservation Date" : "Check-in"}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">
                          {selectedBooking.leavingDate
                            ? new Date(selectedBooking.leavingDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : selectedBooking.place?.type === "restaurant" && (selectedBooking as any).bookingTime
                            ? selectedBooking.bookingTime
                            : "N/A"}
                        </div>
                        <div className="text-xs">{selectedBooking.place?.type === "restaurant" ? "Time" : "Check-out"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info for Guest Houses */}
                  {selectedBooking.place?.type === "guest_house" && selectedBooking.roomNumber && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Room Number: </span>
                        {selectedBooking.roomNumber}
                      </p>
                    </div>
                  )}

                  {/* Additional Info for Restaurants */}
                  {selectedBooking.place?.type === "restaurant" && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Reservation Time: </span>
                        {selectedBooking.createdAt
                          ? new Date(selectedBooking.createdAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : selectedBooking.bookingTime || "N/A"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Map Section */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Location</h4>
                  <div className="w-full h-[400px] bg-muted rounded-xl overflow-hidden">
                    {selectedBooking.place?.latitude && selectedBooking.place?.longitude ? (
                      <iframe
                        src={`https://maps.google.com/maps?q=${selectedBooking.place.latitude},${selectedBooking.place.longitude}&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Location Map"
                      ></iframe>
                    ) : selectedBooking.place?.address ? (
                      <iframe
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedBooking.place.address)}&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Location Map"
                      ></iframe>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-muted-foreground">Map View</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Place Information */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Place Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Place Type</label>
                      <p className="font-medium capitalize">{selectedBooking.place?.type?.replace('_', ' ') || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Booking ID</label>
                      <p className="font-medium">{selectedBooking._id}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Total Price</label>
                      <p className="font-medium">${selectedBooking.totalPrice || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Booked On</label>
                      <p className="font-medium">
                        {selectedBooking.createdAt
                          ? new Date(selectedBooking.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A"}
                      </p>
                    </div>
                    {selectedBooking.place?.type === "restaurant" && (
                      <>
                        <div>
                          <label className="text-sm text-muted-foreground">Reservation Date</label>
                          <p className="font-medium">
                            {selectedBooking.bookingDay
                              ? new Date(selectedBooking.bookingDay).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Reservation Time</label>
                          <p className="font-medium">{selectedBooking.bookingTime || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Number of Tables</label>
                          <p className="font-medium">{selectedBooking.memberNumber || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Booking Type</label>
                          <p className="font-medium">{selectedBooking.bookingType || "N/A"}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Program Details Modal */}
      <Dialog open={programModalOpen} onOpenChange={setProgramModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{selectedProgram?.name || 'Program Details'}</DialogTitle>
            <DialogDescription>
              {selectedProgram?.destination} • {selectedProgram?.checkInDate} to {selectedProgram?.checkOutDate}
            </DialogDescription>
          </DialogHeader>

          {selectedProgram && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h4 className="text-lg font-semibold mb-3">Activities</h4>
                  <div className="space-y-3">
                    {selectedProgram.activities?.map((act: any, idx: number) => (
                      <Card key={idx} className={`p-3 ${selectedActivityIndex === idx ? 'border-primary border-2' : ''}`}>
                        <CardContent className="flex items-center gap-3">
                          {act.image ? (
                            <img src={act.image} alt={act.name} className="w-20 h-16 object-cover rounded-md" />
                          ) : (
                            <div className="w-20 h-16 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">No Image</div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold">{act.name}</h5>
                              <span className="text-xs text-muted-foreground">{act.startTime || act.time || ''}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{act.description || ''}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => setSelectedActivityIndex(idx)}>Show on Map</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-1">
                  <h4 className="text-lg font-semibold mb-3">Map</h4>
                  <div className="w-full h-[320px] bg-muted rounded-xl overflow-hidden">
                    {selectedProgram.activities && selectedProgram.activities.length > 0 ? (
                      <MapContainer
                        center={[
                          Number(selectedProgram.activities[selectedActivityIndex]?.latitude) || 30.0444,
                          Number(selectedProgram.activities[selectedActivityIndex]?.longitude) || 31.2357,
                        ]}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                      >
                        <ProgramMap activities={selectedProgram.activities} selectedIndex={selectedActivityIndex} />
                      </MapContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">No coordinates available for this program</div>
                    )}
                  </div>

                  {selectedProgram.suggest?.guestHouses && selectedProgram.suggest.guestHouses.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-lg font-semibold mb-2">Suggested Guest Houses</h4>
                      <div className="space-y-2">
                        {selectedProgram.suggest.guestHouses.map((house: any, i:number) => (
                          <Card key={house.id || i} className="p-3">
                            <CardContent className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold">{house.name}</div>
                                <div className="text-xs text-muted-foreground">${house.price} per night</div>
                              </div>
                              <Button size="sm" onClick={() => navigate(`/booking/${house.id}`)}>Book</Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setProgramModalOpen(false)}>Close</Button>
                <Button variant="destructive" onClick={async() => {
                  await api.delete(`/api/program/${selectedProgram._id}`)
                  if (!selectedProgram) return;
                  setProgramToConfirmDelete(selectedProgram);
                  setConfirmDeleteOpen(true);
                }}>Delete Program</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Modal */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Program</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the program <strong>{programToConfirmDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              if (!programToConfirmDelete) return;
              try {
                const res = await programApi.deleteProgram(programToConfirmDelete._id);
                const result = (res as any).data || res;
                const ok = (res as any).success === true || result?.success === true || Boolean((res as any).success);
                if (!ok && (res as any).success === false) {
                  throw new Error((res as any).message || 'Failed to delete program.');
                }
                setUserPrograms((prev) => prev.filter(p => p._id !== programToConfirmDelete._id));
                // Close program modal if it's the same program
                if (selectedProgram && selectedProgram._id === programToConfirmDelete._id) {
                  setProgramModalOpen(false);
                  setSelectedProgram(null);
                }
                setConfirmDeleteOpen(false);
                setProgramToConfirmDelete(null);
                try { window.dispatchEvent(new Event('programDeleted')); } catch (e) {}
                toast({ title: 'Deleted', description: 'Program deleted successfully.' });
              } catch (err: any) {
                console.error('Failed to delete program', err);
                toast({ title: 'Error', description: err?.message || 'Failed to delete program.' });
              }
            }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  );
};

export default Profile;
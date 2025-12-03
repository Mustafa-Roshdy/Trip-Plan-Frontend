import React, { useEffect, useState } from "react";
import { deleteGuestHouse, getUserPlaces, getGuestHousesByCreator, updatePlace } from "@/Redux/Slices/guestHouseSlice";
import { getRestaurantsByCreator} from "@/Redux/Slices/restaurantSlice"
import {
  Building2,
  Utensils,
  Edit,
  Trash2,
  Grid,
  Table as TableIcon,
  Plus,
  Menu,
  Calendar,
  Lock,
  Unlock,
  Clock,
  Images,
  Star,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  DollarSign,
  MapPin,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/Redux/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate, Link, useLocation } from "react-router-dom";

import Footer from "@/components/Footer";
import NavbarChatIcon from "@/components/NavbarChatIcon";
import Cookies from "js-cookie";


import api from "@/interceptor/api";

type BizType = "guesthouse" | "restaurant";
type BizItem = {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  image?:string
  images?: string | string[] | null;
  type: string;
  description?: string;
  rooms?: number;
  rating?: number;
  cuisine?: string | string[];
  isAvailable?: boolean;
  breakfast?: boolean;
  wifi?: boolean;
  airConditioning?: boolean;
};

const mockOwner = {
  name: "Golden Nile Owner",
  email: "owner@goldennile.com",
  photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Owner",
};

const OwnerDashboard: React.FC = () => {
  const { pathname } = useLocation();
  
    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  //  جلب البيانات من Redux
  // const { list } = useSelector((state: RootState) => state.guestHouse);

  // Separate state for guest houses and restaurants
  const [guestHousesList, setGuestHousesList] = useState<BizItem[]>([]);
  const [restaurantsList, setRestaurantsList] = useState<BizItem[]>([]);


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


  const [userData, setUserData] = useState<any>({});
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploadLoading, setPhotoUploadLoading] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  // User info from token
  const [userInfo, setUserInfo] = useState<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    gender: string;
    photo?: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<
    "overview" | "guesthouses" | "restaurants" | "settings" | "reservations"
  >("overview");
  const [reservations, setReservations] = useState<any[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [deleteBookingDialog, setDeleteBookingDialog] = useState<{
    open: boolean;
    bookingId: string | null;
  }>({
    open: false,
    bookingId: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string | null;
    type: BizType | null;
  }>({
    open: false,
    id: null,
    type: null,
  });

  const [imageCarousel, setImageCarousel] = useState<{
    placeId: string | null;
    currentIndex: number;
    images: string[];
  }>({
    placeId: null,
    currentIndex: 0,
    images: [],
  });

  const [alertModal, setAlertModal] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: ""
  });

  const showAlert = (title: string, message: string) => {
    setAlertModal({ open: true, title, message });
  };

  //  Decode token to get user info
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

  // fetch user data and save to state - always runs on page refresh (mount)
  const  fetchAndSaveUserData = async (id: string) => {
    try {
      const res = await api.get(`/api/user/${id}`);
      const data = res?.data || null;
      if (data) {
        // Construct full photo URL if photo exists
        if (data.photo) {
          data.photo = `http://localhost:8000${data.photo}`;
        }
        setUserData(data);
        // persist in localStorage so it survives page refreshes
        try {
          localStorage.setItem("goldenNileUserData", JSON.stringify(data));
        } catch {}
      }
      return data;
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      return null;
    }
  };

  // Listen for booking creation events
  useEffect(() => {
    const handleBookingCreated = () => {
      if (userInfo?.id) {
        fetchReservations(userInfo.id);
      }
    };

    const handleBookingDeleted = () => {
      if (userInfo?.id) {
        fetchReservations(userInfo.id);
      }
    };

    window.addEventListener('bookingCreated', handleBookingCreated);
    window.addEventListener('bookingDeleted', handleBookingDeleted);

    return () => {
      window.removeEventListener('bookingCreated', handleBookingCreated);
      window.removeEventListener('bookingDeleted', handleBookingDeleted);
    };
  }, [userInfo?.id]);

  //  Fetch user places on mount and ensure userData is fetched & used
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

      // Fetch both guest houses and restaurants separately
      try {
        const ghResult = await dispatch(getGuestHousesByCreator(payload.id));
        if (getGuestHousesByCreator.fulfilled.match(ghResult)) {
          setGuestHousesList(ghResult.payload);
        } else {
          setGuestHousesList([]);
        }
      } catch (e) {
        console.error(e);
        setGuestHousesList([]);
      }

      try {
        const rResult = await dispatch(getRestaurantsByCreator(payload.id));
        if (getRestaurantsByCreator.fulfilled.match(rResult)) {
          setRestaurantsList(rResult.payload);
        } else {
          setRestaurantsList([]);
        }
      } catch (e) {
        console.error(e);
        setRestaurantsList([]);
      }

      // Fetch reservations for owned places
      fetchReservations(payload.id);
    })();
  }, [dispatch, navigate]);

  const fetchReservations = async (userId: string) => {
    setReservationsLoading(true);
    try {
      // Use the new admin endpoint to get all bookings for places owned by this admin
      const res = await api.get(`/api/booking/admin/${userId}`);
      if (res) {
        const d: any = res;
        if (d.success) {
          const data = res.data;
          // Sort by most recent first
          const sortedData = (data || []).sort((a: any, b: any) =>
            new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
          );
          setReservations(sortedData);

        } else {
          setReservations([]);
        }
      } else {
        setReservations([]);
      }
    } catch (err) {
      console.error("Failed to fetch reservations:", err);
      setReservations([]);
    } finally {
      setReservationsLoading(false);
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Waiting":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Running":
        return "text-green-600 bg-green-50 border-green-200";
      case "Finished":
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
        return <Star className="h-5 w-5" />;
      case "Finished":
        return <Calendar className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const handleDeleteBooking = async () => {
    const { bookingId } = deleteBookingDialog;
    if (!bookingId) return;

    try {
      await api.delete(`/api/booking/${bookingId}`);
      // Update local state immediately
      setReservations(prev => prev.filter(booking => booking._id !== bookingId));
      // Also dispatch event to update Profile.tsx if it's open
      window.dispatchEvent(new CustomEvent('bookingDeleted', {
        detail: { bookingId }
      }));
    } catch (err) {
      console.error("Failed to delete booking:", err);
      showAlert("Delete Failed", "Failed to delete booking. Please try again.");
    } finally {
      setDeleteBookingDialog({ open: false, bookingId: null });
    }
  };

  // Use separate lists for guest houses and restaurants
  const filteredItems = (): BizItem[] => {
    if (activeTab === "guesthouses")
      return guestHousesList.map((g) => ({ ...g, type: "guesthouse" }));
    if (activeTab === "restaurants")
      return restaurantsList.map((r) => ({ ...r, type: "restaurant" }));
    return [
      ...guestHousesList.map((g) => ({ ...g, type: "guesthouse" })),
      ...restaurantsList.map((r) => ({ ...r, type: "restaurant" })),
    ];
  };

  const total = guestHousesList.length + restaurantsList.length;

  //  حذف عنصر (اختياري)


// ...

const confirmDelete = async () => {
  const { id, type } = deleteDialog;
  if (!id) return;
  try {
    await dispatch(deleteGuestHouse(id)).unwrap();
    // Update local state immediately
    if (type === "guesthouse") {
      setGuestHousesList(prev => prev.filter(item => item._id !== id));
    } else if (type === "restaurant") {
      setRestaurantsList(prev => prev.filter(item => item._id !== id));
    }
  } catch (err) {
    console.error("Error deleting:", err);
    showAlert("Delete Failed", "Failed to delete place.");
  } finally {
    setDeleteDialog({ open: false, id: null, type: null });
  }
};


  const handleEdit = (id: string, type: BizType) => {
    const item = [...guestHousesList, ...restaurantsList].find(item => item._id === id);
    if (item) {
      navigate("/add-business", {
        state: {
          editMode: true,
          businessData: item,
          editId: id,
          businessType: type
        }
      });
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      // Check if trying to open a guest house with 0 rooms
      const item = [...guestHousesList, ...restaurantsList].find(item => item._id === id);
      if (item?.type === "guesthouse" && item.rooms === 0 && !currentStatus) {
        showAlert("Cannot Open", "Cannot open a guest house with 0 rooms. Please add rooms first.");
        return;
      }

      await dispatch(updatePlace({ id, data: { isAvailable: !currentStatus } })).unwrap();
      // Update local state
      setGuestHousesList(prev => prev.map(item =>
        item._id === id ? { ...item, isAvailable: !currentStatus } : item
      ));
      setRestaurantsList(prev => prev.map(item =>
        item._id === id ? { ...item, isAvailable: !currentStatus } : item
      ));

    } catch (err) {
      console.error("Error toggling availability:", err);
      showAlert("Update Failed", "Failed to update availability");
    }
  };

  const handleScheduleClick = (id: string) => {
    // TODO: Implement schedule dialog
    showAlert("Coming Soon", "Schedule feature coming soon!");
  };

  const openImageCarousel = (placeId: string, images: string[]) => {
    setImageCarousel({
      placeId,
      currentIndex: 0,
      images,
    });
  };

  const closeImageCarousel = () => {
    setImageCarousel({
      placeId: null,
      currentIndex: 0,
      images: [],
    });
  };

  const nextImage = () => {
    setImageCarousel(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length,
    }));
  };

  const prevImage = () => {
    setImageCarousel(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1,
    }));
  };

  // Auto-slide effect
  useEffect(() => {
    if (imageCarousel.placeId && imageCarousel.images.length > 1) {
      const interval = setInterval(() => {
        nextImage();
      }, 3000); // Change image every 3 seconds

      return () => clearInterval(interval);
    }
  }, [imageCarousel.placeId, imageCarousel.currentIndex]);

  const renderTable = () => {
    return (
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Rooms/Cuisine</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems().map((item) => (
              <TableRow key={`${item.type}-${item._id}`}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.address}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {item.rating || 0}
                  </div>
                </TableCell>
                <TableCell>
                  {item.type === "guesthouse" ? (
                    <div>
                      <div>{item.rooms} rooms</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.breakfast && <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">Breakfast</span>}
                        {item.wifi && <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">WiFi</span>}
                        {item.airConditioning && <span className="text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded">AC</span>}
                      </div>
                    </div>
                  ) : (
                    Array.isArray(item.cuisine) ? item.cuisine.join(", ") : item.cuisine || "N/A"
                  )}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {item.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate("/add-business", {
                          state: { editMode: true, businessData: item },
                        })
                      }
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleAvailability(item._id, item.isAvailable)}
                    >
                      {item.isAvailable ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleScheduleClick(item._id)}
                    >
                      <Clock className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          id: item._id,
                          type: item.type as BizType,
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  };

  const renderCards = () => {
    const getImageUrl = (item: BizItem): string | null => {
      // Check for images array first, then fall back to image field
      if (item.images) {
        if (Array.isArray(item.images) && item.images.length > 0) {
          return item.images[0];
        }
        if (typeof item.images === 'string') {
          return item.images;
        }
      }
      return item.image || null;
    };

    const getAllImages = (item: BizItem): string[] => {
      if (item.images) {
        if (Array.isArray(item.images)) {
          return item.images;
        }
        if (typeof item.images === 'string') {
          return [item.images];
        }
      }
      return item.image ? [item.image] : [];
    };

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems().map((item) => {
          const imageUrl = getImageUrl(item);
          const allImages = getAllImages(item);
          return (
            <Card
              key={`${item.type}-${item._id}`}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48 bg-muted group cursor-pointer">
                {imageUrl ? (
                  <>
                    <img
                      src={allImages[imageCarousel.placeId === item._id ? imageCarousel.currentIndex : 0] || imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {allImages.length > 1 && (
                      <>
                        {/* Navigation Arrows */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openImageCarousel(item._id, allImages);
                            prevImage();
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openImageCarousel(item._id, allImages);
                            nextImage();
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Image Indicators */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {allImages.slice(0, 5).map((_, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setImageCarousel({
                                  placeId: item._id,
                                  currentIndex: idx,
                                  images: allImages,
                                });
                              }}
                              className={`w-2 h-2 rounded-full ${
                                (imageCarousel.placeId === item._id ? imageCarousel.currentIndex : 0) === idx
                                  ? "bg-white"
                                  : "bg-white/50"
                              }`}
                            />
                          ))}
                          {allImages.length > 5 && (
                            <span className="text-white text-xs ml-1">+{allImages.length - 5}</span>
                          )}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                    {item.type === "guesthouse" ? (
                      <Building2 className="w-10 h-10" />
                    ) : (
                      <Utensils className="w-10 h-10" />
                    )}
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium capitalize">
                  {item.type}
                </div>
                {allImages.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <Images className="w-3 h-3" />
                    {allImages.length}
                  </div>
                )}
              </div>

       <CardContent className="p-5">
  <h3 className="text-lg font-semibold">{item.name}</h3>
  <p className="text-sm text-muted-foreground">{item.address}</p>
  <p className="text-sm text-muted-foreground">{item.phone}</p>
  <div className="flex items-center gap-2 mt-2">
    <Star fill="#FFD700" strokeWidth={0}/> {item.rating || 0}
    <span className={`px-2 py-1 rounded-full text-xs ${
      item.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    }`}>
      {item.isAvailable ? "Available" : "Unavailable"}
    </span>
  </div>
  {item.type === "guesthouse" && item.rooms && (
    <div className="text-sm text-muted-foreground mt-1 space-y-1">
      <p>
        <Building2 className="w-4 h-4 inline mr-1" />
        {item.rooms} rooms
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        {item.breakfast && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Breakfast
          </span>
        )}
        {item.wifi && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            WiFi
          </span>
        )}
        {item.airConditioning && (
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
            AC
          </span>
        )}
      </div>
    </div>
  )}
  {item.type === "restaurant" && item.cuisine && (
    <div className="flex flex-wrap gap-1 mt-1">
      {Array.isArray(item.cuisine) ? item.cuisine.slice(0, 3).map((c, idx) => (
        <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          {c}
        </span>
      )) : (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          {item.cuisine}
        </span>
      )}
      {Array.isArray(item.cuisine) && item.cuisine.length > 3 && (
        <span className="text-xs text-muted-foreground">+{item.cuisine.length - 3} more</span>
      )}
    </div>
  )}

  <div className="flex justify-center gap-2 mt-4 pt-4 border-t">
    <Button
      size="sm"
    onClick={() => handleEdit(item._id, item.type as BizType)}
    >
      <Edit className="w-4 h-4 mr-1" /> Edit
    </Button>


    <Button
      size="sm"
      variant="outline"
      onClick={() => handleToggleAvailability(item._id, item.isAvailable)}
    >
      {item.isAvailable ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
    </Button>

    <Button
      size="sm"
      variant="outline"
      onClick={() => handleScheduleClick(item._id)}
    >
      <Clock className="w-4 h-4" />
    </Button>

    <Button
      size="sm"
      variant="destructive"
      onClick={() =>
        setDeleteDialog({
          open: true,
          id: item._id,
          type: item.type as BizType,
        })
      }
    >
      <Trash2 className="w-4 h-4 mr-1" /> Delete
    </Button>
  </div>
</CardContent>

        </Card>
      );
        })}
      </div>
    );
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>

      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top- z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center gap-4">
              <img
                src={photoPreview || userData?.photo || userInfo?.photo || `https://api.dicebear.com/7.x/personas/svg?seed=${userInfo?.firstName || 'User'}${userInfo?.lastName || ''}`}
                alt={userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : "User"}
                className="w-10 h-10 rounded-full border-2 border-primary shadow-sm object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://api.dicebear.com/7.x/personas/svg?seed=User";
                }}
              />
              <div className="hidden sm:block">
                <h3 className="font-semibold text-sm">
                  {userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : "Loading..."}
                </h3>
                <p className="text-xs text-muted-foreground">{userInfo?.email || "Loading..."}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {["overview", "guesthouses", "restaurants", "reservations", "settings"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeTab === tab
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {tab === "reservations" && <Calendar className="w-4 h-4" />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                )
              )}
              <div className="h-6 w-px bg-border mx-2"></div>
              <NavbarChatIcon />
              <div className="h-6 w-px bg-border mx-2"></div>
              <Link
                to="/"
                onClick={() => { Cookies.remove("goldenNileToken"); }}
                className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              >
                Log Out
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {["overview", "guesthouses", "restaurants", "reservations", "settings"].map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab as any);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                        activeTab === tab
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {tab === "reservations" && <Calendar className="w-4 h-4" />}
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  )
                )}
                <div className="border-t my-2"></div>
                <Link
                  to="/"
                  onClick={() => {
                    Cookies.remove("goldenNileToken");
                    setMobileMenuOpen(false);
                  }}
                  className="block px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  Log Out
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="min-h-screen bg-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Main */}
          <main className="w-full">
            {activeTab === "overview" && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-3xl font-bold">Dashboard Overview</h1>
                  <Button onClick={() => navigate("/add-business")}>
                    <Plus className="w-4 h-4 mr-2" /> Add Business
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-primary mb-2">
                        {total}
                      </div>
                      <p className="text-muted-foreground">Total Businesses</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-primary mb-2">
                        {guestHousesList.length}
                      </div>
                      <p className="text-muted-foreground">Guesthouses</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-primary mb-2">
                        {restaurantsList.length}
                      </div>
                      <p className="text-muted-foreground">Restaurants</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {(activeTab === "guesthouses" || activeTab === "restaurants") && (
              <>
                {/* Header with Add Button */}
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-3xl font-bold">
                    {activeTab === "guesthouses" ? "My Guesthouses" : "My Restaurants"}
                  </h1>
                  <div className="flex gap-2">
                    <Button onClick={() => navigate("/add-business")}>
                      <Plus className="w-4 h-4 mr-2" /> Add Business
                    </Button>
                  </div>
                </div>

                {/* View Toggle Buttons */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "cards" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("cards")}
                    >
                      <Grid className="w-4 h-4 mr-2" />
                      Cards
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                    >
                      <TableIcon className="w-4 h-4 mr-2" />
                      Table
                    </Button>
                  </div>
                </div>

                {/* Content */}
                {viewMode === "cards" ? renderCards() : renderTable()}
              </>
            )}

            {activeTab === "reservations" && (
              <div className="animate-fade-in">
                <h1 className="text-3xl font-bold mb-6">Reservations</h1>
                {reservationsLoading ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading reservations...</p>
                    </CardContent>
                  </Card>
                ) : reservations.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No reservations yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Reservations will appear here once customers make bookings for your places.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {reservations.map((booking, index) => (
                      <Card
                        key={booking._id}
                        className="overflow-hidden hover:shadow-lg transition-shadow animate-slide-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                            <div>
                              <h3 className="text-2xl font-bold mb-2">{booking.place?.name || "Booking"}</h3>
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(getBookingStatus(booking.arrivalDate || "", booking.leavingDate || "", booking.place?.type || "guest_house", booking.bookingTime))}`}>
                                {getStatusIcon(getBookingStatus(booking.arrivalDate || "", booking.leavingDate || "", booking.place?.type || "guest_house", booking.bookingTime))}
                                <span>{getBookingStatus(booking.arrivalDate || "", booking.leavingDate || "", booking.place?.type || "guest_house", booking.bookingTime)}</span>
                              </div>
                            </div>
                            <div className="mt-4 md:mt-0">
                              <span className="text-2xl font-bold text-primary">${booking.totalPrice || "N/A"}</span>
                            </div>
                          </div>

                          {/* Booking Information Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 text-primary" />
                              <div>
                                <div className="font-medium text-foreground">{booking.place?.address || "N/A"}</div>
                                <div className="text-xs">Location</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4 text-primary" />
                              <div>
                                <div className="font-medium text-foreground">{booking.memberNumber || "N/A"}</div>
                                <div className="text-xs">{booking.place?.type === "restaurant" ? "Tables" : "Guests"}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4 text-primary" />
                              <div>
                                <div className="font-medium text-foreground">
                                  {booking.place?.type === "restaurant" && booking.bookingDay
                                    ? new Date(booking.bookingDay).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : booking.arrivalDate
                                    ? new Date(booking.arrivalDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : "N/A"}
                                </div>
                                <div className="text-xs">{booking.place?.type === "restaurant" ? "Reservation Date" : "Check-in"}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4 text-primary" />
                              <div>
                                <div className="font-medium text-foreground">
                                  {booking.place?.type === "restaurant" && booking.bookingTime
                                    ? booking.bookingTime
                                    : booking.leavingDate
                                    ? new Date(booking.leavingDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : "N/A"}
                                </div>
                                <div className="text-xs">{booking.place?.type === "restaurant" ? "Time" : "Check-out"}</div>
                              </div>
                            </div>
                          </div>

                          {/* Booking Details Section */}
                          <div className="mt-4 pt-4 border-t border-border">
                            <h5 className="text-sm font-semibold text-foreground mb-3">Booking Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Booking ID: </span>
                                <span className="font-medium text-foreground">{booking._id}</span>
                              </div>
                              {booking.place?.type === "restaurant" && (
                                <>
                                  <div>
                                    <span className="text-muted-foreground">Reservation Time: </span>
                                    <span className="font-medium text-foreground">{booking.bookingTime || "N/A"}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Booking Type: </span>
                                    <span className="font-medium text-foreground">{booking.bookingType || "restaurant"}</span>
                                  </div>
                                </>
                              )}
                              {booking.place?.type === "guest_house" && booking.roomNumber && (
                                <div>
                                  <span className="text-muted-foreground">Room Number: </span>
                                  <span className="font-medium text-foreground">{booking.roomNumber}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">Booked On: </span>
                                <span className="font-medium text-foreground">
                                  {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }) : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="mt-4 pt-4 border-t border-border flex justify-end">
                            <Button
                              variant="destructive"
                              onClick={() => {
                                setDeleteBookingDialog({
                                  open: true,
                                  bookingId: booking._id,
                                });
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Booking
                            </Button>
                          </div>
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
                            <p className="text-sm text-muted-foreground">{userInfo?.firstName || "N/A"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Last Name</label>
                            <p className="text-sm text-muted-foreground">{userInfo?.lastName || "N/A"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <p className="text-sm text-muted-foreground">{userInfo?.email || "N/A"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Gender</label>
                            <p className="text-sm text-muted-foreground capitalize">{userInfo?.gender || "N/A"}</p>
                          </div>
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

      {/* Delete confirmation for places */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, id: null, type: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this place and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation for bookings */}
      <AlertDialog
        open={deleteBookingDialog.open}
        onOpenChange={(open) => setDeleteBookingDialog({ open, bookingId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBooking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </>
  );
};

export default OwnerDashboard;

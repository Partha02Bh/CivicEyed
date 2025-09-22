// Install required package: npm install exifreader

import { useCallback, useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  ArrowLeft,
  MapPin,
  Upload,
  Send,
  Image,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Navigation,
  Shield,
  Camera,
  AlertTriangle,
  X,
  MapPinIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MapComponent from "../components/MapBox";
import { toast } from "sonner";
import { VITE_BACKEND_URL } from "../config/config";
import { motion } from "framer-motion";
import ExifReader from 'exifreader';

// Enhanced Image Verification Service - More Flexible Approach
class ImageVerificationService {
  static dmsToDecimal(dmsArray, ref) {
    if (!dmsArray || dmsArray.length !== 3) return null;
    
    const degrees = dmsArray[0];
    const minutes = dmsArray[1];
    const seconds = dmsArray[2];
    
    let decimal = degrees + minutes / 60 + seconds / 3600;
    
    if (ref === 'S' || ref === 'W') {
      decimal = -decimal;
    }
    
    return decimal;
  }

  static async extractExifData(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const tags = ExifReader.load(arrayBuffer);
      
      return {
        make: tags.Make?.description || null,
        model: tags.Model?.description || null,
        software: tags.Software?.description || null,
        dateTime: tags.DateTime?.description || null,
        dateTimeOriginal: tags.DateTimeOriginal?.description || null,
        dateTimeDigitized: tags.DateTimeDigitized?.description || null,
        gpsLatitude: tags.GPSLatitude?.description || null,
        gpsLongitude: tags.GPSLongitude?.description || null,
        gpsLatitudeRef: tags.GPSLatitudeRef?.description || null,
        gpsLongitudeRef: tags.GPSLongitudeRef?.description || null,
        gpsAltitude: tags.GPSAltitude?.description || null,
        gpsTimeStamp: tags.GPSTimeStamp?.description || null,
        exposureTime: tags.ExposureTime?.description || null,
        fNumber: tags.FNumber?.description || null,
        iso: tags.ISOSpeedRatings?.description || null,
        flash: tags.Flash?.description || null,
        focalLength: tags.FocalLength?.description || null,
        whiteBalance: tags.WhiteBalance?.description || null,
        colorSpace: tags.ColorSpace?.description || null,
        orientation: tags.Orientation?.description || null,
        thumbnailPresent: !!(tags.ThumbnailImage || tags['Thumbnail Image']),
        rawExif: tags
      };
    } catch (error) {
      console.error('Error extracting EXIF data:', error);
      return null;
    }
  }

  static detectSuspiciousPatterns(file, exifData) {
    const suspiciousIndicators = [];
    let suspiciousScore = 0;

    // Check for AI-generated image patterns
    const fileName = file.name.toLowerCase();
    const aiPatterns = [
      'generated', 'ai_generated', 'synthetic', 'artificial', 'fake',
      'midjourney', 'dalle', 'stablediffusion', 'openai', 'generated_image'
    ];
    
    if (aiPatterns.some(pattern => fileName.includes(pattern))) {
      suspiciousScore += 50;
      suspiciousIndicators.push('AI-related filename detected');
    }

    // Check for suspicious software in EXIF
    if (exifData?.software) {
      const suspiciousSoftware = [
        'midjourney', 'dall-e', 'stable diffusion', 'artbreeder', 'thispersondoesnotexist',
        'generated', 'synthetic', 'ai generated'
      ];
      
      const softwareLower = exifData.software.toLowerCase();
      if (suspiciousSoftware.some(sw => softwareLower.includes(sw))) {
        suspiciousScore += 80;
        suspiciousIndicators.push(`Suspicious software detected: ${exifData.software}`);
      }
    }

    // Check file size patterns (AI images often have specific size patterns)
    if (file.size < 50000) { // Very small file size
      suspiciousScore += 20;
      suspiciousIndicators.push('Unusually small file size for a camera photo');
    }

    // Check for perfect square dimensions (common in AI generated images)
    if (exifData?.rawExif?.ImageWidth && exifData?.rawExif?.ImageHeight) {
      const width = exifData.rawExif.ImageWidth.value;
      const height = exifData.rawExif.ImageHeight.value;
      
      const commonAISizes = [512, 768, 1024, 1536, 2048];
      if (commonAISizes.includes(width) && commonAISizes.includes(height)) {
        suspiciousScore += 30;
        suspiciousIndicators.push(`Suspicious dimensions: ${width}x${height} (common AI generation size)`);
      }
    }

    return {
      isSuspicious: suspiciousScore >= 50,
      suspiciousScore,
      indicators: suspiciousIndicators
    };
  }

  static verifyCameraOrigin(exifData, file) {
    if (!exifData) {
      // If no EXIF data, check file patterns for suspicious content
      const suspiciousCheck = this.detectSuspiciousPatterns(file, null);
      
      if (suspiciousCheck.isSuspicious) {
        return { 
          isCamera: false, 
          confidence: 10, 
          reasons: ['No EXIF data found', ...suspiciousCheck.indicators],
          category: 'suspicious'
        };
      }
      
      // No EXIF but not suspicious - could be a legitimate photo that lost metadata
      return { 
        isCamera: true, 
        confidence: 30, 
        reasons: ['No EXIF data - metadata may have been stripped during transfer'],
        category: 'acceptable'
      };
    }
    
    const reasons = [];
    let confidenceScore = 0;
    let category = 'unknown';

    // First check for suspicious patterns
    const suspiciousCheck = this.detectSuspiciousPatterns(file, exifData);
    if (suspiciousCheck.isSuspicious) {
      return {
        isCamera: false,
        confidence: 10,
        reasons: suspiciousCheck.indicators,
        category: 'suspicious'
      };
    }

    // Camera make/model check (more lenient)
    if (exifData.make && exifData.model) {
      const knownCameraBrands = [
        'Canon', 'Nikon', 'Sony', 'Olympus', 'Fujifilm', 'Panasonic', 'Leica',
        'Apple', 'Samsung', 'Google', 'Huawei', 'OnePlus', 'Xiaomi', 'LG',
        'Motorola', 'Nokia', 'Oppo', 'Vivo', 'Realme', 'Honor', 'Redmi'
      ];
      
      const makeUpper = exifData.make.toUpperCase();
      const modelUpper = exifData.model.toUpperCase();
      
      if (knownCameraBrands.some(brand => makeUpper.includes(brand.toUpperCase()))) {
        confidenceScore += 40;
        reasons.push(`Legitimate camera brand: ${exifData.make} ${exifData.model}`);
        category = 'verified_camera';
      }
    }

    // Camera settings presence (more flexible)
    const cameraSettings = [
      exifData.exposureTime, exifData.fNumber, exifData.iso, 
      exifData.focalLength, exifData.whiteBalance, exifData.flash
    ];
    const settingsPresent = cameraSettings.filter(setting => setting !== null).length;
    
    if (settingsPresent >= 2) {
      confidenceScore += 30;
      reasons.push(`Camera settings present (${settingsPresent}/6)`);
    }

    // DateTime checks (more lenient - don't penalize for transfer delays)
    if (exifData.dateTimeOriginal || exifData.dateTime) {
      confidenceScore += 20;
      reasons.push('Original timestamp present');
      
      // Only check for obviously fake dates (future dates, very old dates)
      try {
        const dateStr = exifData.dateTimeOriginal || exifData.dateTime;
        const exifDate = new Date(dateStr.replace(/:/g, '-').replace(' ', 'T'));
        const now = new Date();
        
        if (exifDate > now) {
          confidenceScore -= 30;
          reasons.push('Future timestamp detected (suspicious)');
        } else if (exifDate.getFullYear() < 2000) {
          confidenceScore -= 20;
          reasons.push('Very old timestamp (may be suspicious)');
        }
      } catch (error) {
        // Don't penalize for unparseable dates
      }
    }

    // GPS data adds credibility
    if (exifData.gpsLatitude && exifData.gpsLongitude) {
      confidenceScore += 25;
      reasons.push('GPS coordinates embedded');
    }

    // Additional positive indicators
    if (exifData.thumbnailPresent) {
      confidenceScore += 15;
      reasons.push('Camera-generated thumbnail present');
    }

    if (exifData.orientation) {
      confidenceScore += 10;
      reasons.push('Image orientation data present');
    }

    if (exifData.colorSpace) {
      confidenceScore += 5;
      reasons.push('Color space information present');
    }

    // Software check (more nuanced)
    if (exifData.software) {
      const harmfulSoftware = [
        'Adobe Photoshop', 'GIMP', 'Canva', 'Figma', 'Sketch'
      ];
      
      const mobileSoftware = [
        'Snapseed', 'VSCO', 'Instagram', 'Lightroom Mobile', 'Camera+',
        'Google Camera', 'Samsung Camera', 'iPhone Camera'
      ];
      
      const softwareUpper = exifData.software.toUpperCase();
      
      if (harmfulSoftware.some(software => softwareUpper.includes(software.toUpperCase()))) {
        confidenceScore -= 25;
        reasons.push(`Professional editing software detected: ${exifData.software}`);
      } else if (mobileSoftware.some(software => softwareUpper.includes(software.toUpperCase()))) {
        confidenceScore += 15;
        reasons.push(`Mobile camera software: ${exifData.software}`);
      } else {
        // Unknown software - neutral
        reasons.push(`Software: ${exifData.software}`);
      }
    }

    // Determine final category
    if (category === 'unknown') {
      if (confidenceScore >= 70) {
        category = 'likely_camera';
      } else if (confidenceScore >= 40) {
        category = 'acceptable';
      } else {
        category = 'questionable';
      }
    }

    // More lenient acceptance criteria
    const isCamera = confidenceScore >= 25; // Lowered threshold
    
    return {
      isCamera,
      confidence: Math.min(100, Math.max(0, confidenceScore)),
      reasons,
      category,
      exifData
    };
  }

  static extractGPSCoordinates(exifData) {
    if (!exifData || !exifData.gpsLatitude || !exifData.gpsLongitude) {
      return null;
    }

    try {
      const latDMS = exifData.gpsLatitude.split(',').map(coord => {
        if (coord.includes('/')) {
          const parts = coord.split('/');
          return parseFloat(parts[0]) / parseFloat(parts[1]);
        }
        return parseFloat(coord);
      });

      const lngDMS = exifData.gpsLongitude.split(',').map(coord => {
        if (coord.includes('/')) {
          const parts = coord.split('/');
          return parseFloat(parts[0]) / parseFloat(parts[1]);
        }
        return parseFloat(coord);
      });

      const latitude = this.dmsToDecimal(latDMS, exifData.gpsLatitudeRef);
      const longitude = this.dmsToDecimal(lngDMS, exifData.gpsLongitudeRef);

      if (latitude === null || longitude === null) {
        return null;
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return null;
      }

      return {
        latitude,
        longitude,
        altitude: exifData.gpsAltitude ? parseFloat(exifData.gpsAltitude) : null,
        timestamp: exifData.gpsTimeStamp || null
      };
    } catch (error) {
      console.error('Error parsing GPS coordinates:', error);
      return null;
    }
  }

  static async verifyAndExtractImageData(file) {
    if (!file.type.startsWith('image/')) {
      return {
        isValid: false,
        error: 'File is not an image',
        isCamera: false,
        gpsCoordinates: null
      };
    }

    const exifData = await this.extractExifData(file);
    const verification = this.verifyCameraOrigin(exifData, file);
    const gpsCoordinates = this.extractGPSCoordinates(exifData);

    return {
      isValid: true,
      isCamera: verification.isCamera,
      confidence: verification.confidence,
      reasons: verification.reasons,
      category: verification.category,
      gpsCoordinates,
      exifData: verification.exifData,
      error: null
    };
  }
}

// Gemini API configuration
const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";
const GEMINI_API_URL = import.meta.env.VITE_GEMINI_API_URL;

const ReportIssue = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: "",
    issueDescription: "",
    issueLocation: "",
    issueType: "Road Infrastructure",
    location: {
      address: "",
      latitude: null,
      longitude: null,
    },
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [gpsFromImage, setGpsFromImage] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = useCallback(
    (lat, lng, address) => {
      setFormData((prev) => ({
        ...prev,
        location: {
          address,
          latitude: lat,
          longitude: lng,
        },
        issueLocation: address,
      }));
      // Reset GPS from image flag when manually selecting location
      setGpsFromImage(false);
    },
    []
  );

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      };
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = "Unable to get location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location access denied. Please enable location permissions.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          reject(new Error(errorMessage));
        },
        options
      );
    });
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (!response.ok) throw new Error("Geocoding failed");
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.warn("Reverse geocoding failed:", error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const captureUserLocation = async () => {
    setLocationLoading(true);
    try {
      toast.info("Getting your current location...", { duration: 3000 });
      const { lat, lng } = await getCurrentLocation();
      const address = await reverseGeocode(lat, lng);
      setFormData((prev) => ({
        ...prev,
        location: { address, latitude: lat, longitude: lng },
        issueLocation: address,
      }));
      setGpsFromImage(false); // Mark as device location, not from image
      toast.success("Location captured successfully!", { duration: 3000 });
    } catch (error) {
      console.error("Error getting location:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to get location",
        {
          duration: 5000,
          action: { label: "Retry", onClick: () => captureUserLocation() },
        }
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result;
        resolve(base64.split(",")[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const analyzeImageWithGemini = async (imageBase64) => {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Analyze this image of a civic issue and provide the following information in JSON format:
               {
                 "title": "Brief, descriptive title for the issue (max 60 characters)",
                 "description": "Detailed description of the issue, what's wrong, and its impact (100-300 words)",
                 "issueType": "One of: Road Infrastructure, Waste Management, Environmental Issues, Utilities & Infrastructure, Public Safety, Other",
                 "location": "Describe the visible location details, landmarks, or area type"
               }
               Focus on:
               - What specific problem is visible in the image
               - Safety concerns or community impact
               - Infrastructure damage or maintenance needs
               - Environmental hazards
               - Public facilities issues
               Provide accurate, helpful descriptions that would help local authorities understand and address the issue.`,
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
      ],
    };
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok)
        throw new Error(`Gemini API error: ${response.status}`);
      const data = await response.json();
      const text = data.candidates[0]?.content?.parts[0]?.text;
      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      }
      throw new Error("No valid response from Gemini API");
    } catch (error) {
      console.error("Error analyzing image:", error);
      throw error;
    }
  };

  // Enhanced processImage function with flexible verification
  const processImage = async (file) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size should be less than 10MB");
      return;
    }

    try {
      // Show processing toast
      toast.info("Processing and verifying image...", { duration: 3000 });
      
      // Verify image and extract data
      const imageData = await ImageVerificationService.verifyAndExtractImageData(file);
      
      if (!imageData.isValid) {
        toast.error(imageData.error);
        return;
      }

      // Handle different verification outcomes
      if (!imageData.isCamera) {
        // Only reject truly suspicious images
        if (imageData.category === 'suspicious') {
          toast.error(
            `Suspicious image detected (${imageData.confidence}% confidence)`, 
            {
              duration: 10000,
              description: `${imageData.reasons[0]}. Please use an authentic camera photo.`,
              action: {
                label: "Take Photo",
                onClick: () => setShowCameraOptions(true)
              }
            }
          );
          return;
        }
        
        // For questionable images, show warning but still accept
        if (imageData.category === 'questionable') {
          toast.warning(
            `Image accepted with low confidence (${imageData.confidence}%)`,
            {
              duration: 8000,
              description: `${imageData.reasons[0]}. Consider taking a fresh photo for better verification.`,
              action: {
                label: "Retake",
                onClick: () => setShowCameraOptions(true)
              }
            }
          );
        }
      }

      // Success - image accepted
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setShowCameraOptions(false);

      // Show appropriate success message based on category
      let successMessage = '';
      let description = '';
      
      switch (imageData.category) {
        case 'verified_camera':
          successMessage = `Authentic camera photo verified! (${imageData.confidence}% confidence)`;
          description = `${imageData.reasons.slice(0, 2).join(', ')}`;
          break;
        case 'likely_camera':
          successMessage = `Likely camera photo accepted (${imageData.confidence}% confidence)`;
          description = `${imageData.reasons.slice(0, 2).join(', ')}`;
          break;
        case 'acceptable':
          successMessage = `Image accepted (${imageData.confidence}% confidence)`;
          description = imageData.reasons.length > 0 ? imageData.reasons[0] : 'Basic verification passed';
          break;
        default:
          successMessage = `Image processed successfully`;
          description = 'Ready for submission';
      }

      toast.success(successMessage, { 
        duration: 4000,
        description: description
      });

      // PRIORITY: Extract GPS coordinates from image FIRST
      if (imageData.gpsCoordinates) {
        const { latitude, longitude } = imageData.gpsCoordinates;
        
        setGpsFromImage(true);
        toast.success("GPS location extracted from photo!", { 
          duration: 4000,
          description: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        });
        
        // Get address from coordinates
        try {
          const address = await reverseGeocode(latitude, longitude);
          setFormData((prev) => ({
            ...prev,
            location: { address, latitude, longitude },
            issueLocation: address,
          }));
        } catch (error) {
          // Fallback to coordinates
          const coordinateString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setFormData((prev) => ({
            ...prev,
            location: { 
              address: coordinateString, 
              latitude, 
              longitude 
            },
            issueLocation: coordinateString,
          }));
        }
        
        // Proceed with AI analysis after GPS extraction
        await analyzeImageWithAI(file);
        
      } else {
        // NO GPS in image - show option to user
        setGpsFromImage(false);
        toast.warning("No GPS data found in photo", {
          duration: 6000,
          description: "Would you like to use your current location instead?",
          action: {
            label: "Use Current Location",
            onClick: async () => {
              await captureUserLocation();
              // Proceed with AI analysis after location is set
              await analyzeImageWithAI(file);
            }
          }
        });
        
        // Still analyze the image even without GPS
        await analyzeImageWithAI(file);
      }

    } catch (error) {
      console.error('Error processing image:', error);
      toast.error("Failed to process image. Please try again.", {
        duration: 4000,
        action: {
          label: "Retry",
          onClick: () => processImage(file)
        }
      });
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await processImage(file);
    }
  };

  const handleCameraCapture = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await processImage(file);
    }
  };

  const analyzeImageWithAI = async (file) => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
      toast.error("Gemini API key not configured");
      return;
    }
    setAiAnalyzing(true);
    try {
      toast.info("AI is analyzing your image...", { duration: 3000 });
      const base64Image = await convertToBase64(file);
      const analysis = await analyzeImageWithGemini(base64Image);
      setFormData((prev) => ({
        ...prev,
        title: analysis.title || "",
        issueDescription: analysis.description || "",
        issueType: analysis.issueType || "Other",
        // Keep existing location data, don't overwrite with AI location description
        issueLocation: prev.location.address || analysis.location || "",
      }));
      toast.success("AI analysis complete! Form auto-filled", {
        duration: 4000,
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast.error("Failed to analyze image. Please fill details manually.", {
        duration: 4000,
      });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleReanalyze = () => {
    if (selectedFile) {
      analyzeImageWithAI(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.issueDescription ||
      !formData.location.address
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("You must be logged in");
        return;
      }
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.issueDescription);
      data.append("issueType", formData.issueType);
      data.append(
        "location",
        JSON.stringify({
          latitude: formData.location.latitude,
          longitude: formData.location.longitude,
          address: formData.location.address,
        })
      );
      if (selectedFile) {
        data.append("files", selectedFile);
      }
      const response = await fetch(
        `${VITE_BACKEND_URL}/api/v1/citizen/create-issue`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: data,
        }
      );
      const result = await response.json();
      if (response.ok) {
        toast.success("Issue reported successfully!");
        navigate("/citizen");
      } else {
        toast.error(result.message || "Failed to report issue");
      }
    } catch (error) {
      console.error("Error reporting issue:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const issueTypes = [
    { value: "Road Infrastructure", label: "Road Infrastructure", icon: "🛣" },
    { value: "Waste Management", label: "Waste Management", icon: "♻" },
    { value: "Environmental Issues", label: "Environmental Issues", icon: "🌱" },
    {
      value: "Utilities & Infrastructure",
      label: "Utilities & Infrastructure",
      icon: "⚡",
    },
    { value: "Public Safety", label: "Public Safety", icon: "🛡" },
    { value: "Other", label: "Other", icon: "📝" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50"
    >
      {/* Background theme */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.1),transparent_50%)] -z-1" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.08),transparent_50%)] -z-1" />
      <div
        className="absolute inset-0 -z-1"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Camera Options Modal */}
      {showCameraOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-md p-6 mx-4 bg-white rounded-2xl shadow-2xl"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCameraOptions(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
            
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-green-100">
                  <Camera className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Add Photo
              </h3>
              <p className="mb-6 text-sm text-gray-600">
                Upload a photo to help us better understand and locate the issue
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full py-3 text-white bg-green-600 hover:bg-green-700 rounded-xl"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full py-3 border-green-200 text-green-700 hover:bg-green-50 rounded-xl"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose from Gallery
                </Button>
                
                <div className="flex items-center p-3 border rounded-xl bg-blue-50 border-blue-200">
                  <Shield className="w-4 h-4 mr-2 text-blue-600" />
                  <p className="text-xs text-blue-800">
                    Images are verified for authenticity. GPS data helps with location accuracy.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-green-200/50 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/citizen">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-green-700 hover:text-green-800 hover:bg-green-100/50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </Link>
            <div className="text-center">
              <h1 className="text-lg font-bold text-green-800">
                Report a New Issue
              </h1>
            </div>
            <div className="w-40"></div> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container relative mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 gap-8 mx-auto max-w-7xl xl:grid-cols-2"
        >
          {/* Map Section */}
          <Card className="bg-white/80 backdrop-blur-xl border-green-100 rounded-3xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-green-800">
                <div className="p-2 rounded-lg bg-emerald-100/80">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-lg">Issue Location</span>
                  <p className="mt-1 text-sm font-normal text-green-700/80">
                    {gpsFromImage 
                      ? "Location extracted from photo GPS data" 
                      : "Click on the map to set location manually"}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden border shadow-inner h-80 rounded-2xl border-green-200/80">
                <MapComponent onLocationSelect={handleLocationSelect} />
              </div>

              {locationLoading && (
                <div className="p-3 border rounded-xl bg-blue-50 border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Navigation className="w-4 h-4 text-blue-500 animate-pulse" />
                    <p className="text-sm font-medium text-blue-700">
                      Getting your location...
                    </p>
                  </div>
                </div>
              )}

              {formData.location.latitude && !locationLoading && (
                <div className="p-3 space-y-2 border rounded-xl bg-emerald-50 border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm font-medium text-emerald-800">
                        {gpsFromImage ? "Photo GPS Location" : "Current Location"}
                      </p>
                      {gpsFromImage && (
                        <div className="flex items-center space-x-1 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <MapPinIcon className="h-3 w-3 text-emerald-600" />
                          <span className="text-xs font-medium text-emerald-700">From Image</span>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={captureUserLocation}
                      className="text-xs bg-white/80 border-green-200 text-green-700 hover:bg-green-50"
                      disabled={locationLoading}
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Use Current
                    </Button>
                  </div>
                  <p className="text-sm text-green-800/90">
                    {formData.location.address}
                  </p>
                </div>
              )}

              {!formData.location.latitude && !locationLoading && (
                <div className="p-3 border rounded-xl bg-amber-50 border-amber-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <p className="text-sm font-medium text-amber-800">
                        Location Required
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={captureUserLocation}
                      className="text-xs bg-green-600 text-white hover:bg-green-700"
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Get Location
                    </Button>
                  </div>
                  <p className="text-sm text-amber-700">
                    Please set a location or upload a photo with GPS data
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Section */}
          <Card className="bg-white/80 backdrop-blur-xl border-green-100 rounded-3xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-green-800">
                <div className="p-2 rounded-lg bg-green-100/80">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <span className="text-lg">Describe the Issue</span>
                  <p className="mt-1 text-sm font-normal text-green-700/80">
                    Upload a photo with GPS data for automatic location detection
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label className="font-medium text-green-800">
                    Issue Photo (Optional but Recommended)
                  </Label>
                  <div className="space-y-2">
                    <div
                      onClick={() => setShowCameraOptions(true)}
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                        aiAnalyzing || locationLoading
                          ? "border-green-400 bg-green-50/80"
                          : "border-green-300/70 bg-green-50/50 hover:bg-green-100/60 hover:border-green-400"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center text-center">
                        {aiAnalyzing || locationLoading ? (
                          <div className="flex flex-col items-center">
                            <div className="relative">
                              <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
                              {locationLoading ? (
                                <Navigation className="absolute w-4 h-4 text-blue-400 -top-1 -right-1 animate-pulse" />
                              ) : (
                                <Sparkles className="absolute w-4 h-4 text-purple-400 -top-1 -right-1 animate-pulse" />
                              )}
                            </div>
                            <p className="mt-2 text-sm font-medium text-green-700">
                              {locationLoading
                                ? "Processing GPS..."
                                : "AI Analyzing..."}
                            </p>
                          </div>
                        ) : (
                          <>
                            <Camera className="w-6 h-6 mb-2 text-green-600/70" />
                            <p className="text-sm text-green-700/80">
                              <span className="font-semibold">Click to add photo</span>
                            </p>
                            <p className="text-xs text-green-600/70">
                              GPS Location + Image Verification + AI Analysis
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Hidden inputs */}
                    <Input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCameraCapture}
                      className="hidden"
                      disabled={aiAnalyzing || locationLoading}
                    />
                    
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={aiAnalyzing || locationLoading}
                    />
                    
                    {/* Info message */}
                    <div className="flex items-center p-2 border rounded-lg bg-blue-50 border-blue-200">
                      <Shield className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                      <p className="text-xs text-blue-800">
                        Photos with GPS data will automatically set the issue location. All images are verified for authenticity.
                      </p>
                    </div>
                  </div>
                  
                  {selectedFile && (
                    <div className="flex items-center justify-between p-2 mt-2 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        {imagePreview && (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="object-cover w-10 h-10 rounded-md"
                          />
                        )}
                        <div>
                          <p className="text-sm text-green-800 truncate">
                            {selectedFile.name}
                          </p>
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600">Verified</span>
                            {gpsFromImage && (
                              <>
                                <span className="text-xs text-green-500">•</span>
                                <MapPinIcon className="w-3 h-3 text-emerald-600" />
                                <span className="text-xs text-emerald-600">GPS Extracted</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {!aiAnalyzing && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleReanalyze}
                          className="bg-white/80 border-green-200 text-green-700 hover:bg-green-50 flex-shrink-0"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Re-analyze
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Issue Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center space-x-2 font-medium text-green-800">
                    <span>Title *</span>
                    {formData.title && (
                       <div className="flex items-center space-x-1 bg-green-100 px-2 py-0.5 rounded-full">
                         <Sparkles className="h-3 w-3 text-green-600" />
                         <span className="text-xs font-medium text-green-700">AI</span>
                       </div>
                    )}
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Large pothole on Main Street"
                    required
                    className="py-3 bg-white/90 backdrop-blur-xl border-green-200 rounded-xl text-green-800 placeholder:text-green-500/60 focus:bg-white focus:border-green-400 focus:ring-2 focus:ring-green-200"
                  />
                </div>

                {/* Issue Type */}
                <div className="space-y-3">
                  <Label className="flex items-center space-x-2 font-medium text-green-800">
                     <span>Category *</span>
                     {formData.issueType !== "Road Infrastructure" && (
                       <div className="flex items-center space-x-1 bg-green-100 px-2 py-0.5 rounded-full">
                         <Sparkles className="h-3 w-3 text-green-600" />
                         <span className="text-xs font-medium text-green-700">AI</span>
                       </div>
                    )}
                  </Label>
                  <RadioGroup
                    value={formData.issueType}
                    onValueChange={(value) =>
                      handleInputChange("issueType", value)
                    }
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                  >
                    {issueTypes.map((type) => (
                      <div key={type.value}>
                        <RadioGroupItem
                          value={type.value}
                          id={type.value}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={type.value}
                          className="flex items-center p-3 space-x-2 border rounded-xl cursor-pointer bg-white/60 border-green-200 hover:bg-green-50 peer-checked:bg-green-100 peer-checked:border-green-400"
                        >
                          <span>{type.icon}</span>
                          <span className="text-sm text-green-800">
                            {type.label}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="issueDescription" className="flex items-center space-x-2 font-medium text-green-800">
                    <span>Description *</span>
                    {formData.issueDescription && (
                       <div className="flex items-center space-x-1 bg-green-100 px-2 py-0.5 rounded-full">
                         <Sparkles className="h-3 w-3 text-green-600" />
                         <span className="text-xs font-medium text-green-700">AI</span>
                       </div>
                    )}
                  </Label>
                  <Textarea
                    id="issueDescription"
                    value={formData.issueDescription}
                    onChange={(e) =>
                      handleInputChange("issueDescription", e.target.value)
                    }
                    placeholder="Describe the problem in detail..."
                    required
                    className="min-h-28 bg-white/90 backdrop-blur-xl border-green-200 rounded-xl text-green-800 placeholder:text-green-500/60 focus:bg-white focus:border-green-400 focus:ring-2 focus:ring-green-200"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full py-3 text-base font-semibold text-white transition-all duration-300 border-0 shadow-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:shadow-2xl hover:scale-105 rounded-2xl disabled:opacity-60"
                  disabled={loading || aiAnalyzing || locationLoading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </motion.div>
  );
};

export default ReportIssue;
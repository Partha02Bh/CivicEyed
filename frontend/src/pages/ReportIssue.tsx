// ReportIssue.tsx

// Ensure you have the necessary types installed:
// npm install @types/react @types/react-dom

// NEW: Install the HEIC conversion library
// npm install heic2any

import { useState, useRef, useCallback, useEffect, type FormEvent, type ChangeEvent } from "react";
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
  CheckCircle,
  Sparkles,
  RefreshCw,
  Navigation,
  Shield,
  Camera,
  X,
  MapPinIcon,
  Mic,
  MicOff,
  Volume2,
  Languages,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MapComponent from "../components/MapBox";
import { toast } from "sonner";
import { VITE_BACKEND_URL } from "../config/config";
import { motion } from "framer-motion";
import ExifReader from 'exifreader';
// NEW: Import the HEIC conversion library
import heic2any from 'heic2any';


// --- TYPE DEFINITIONS ---

interface LocationState {
  address: string;
  latitude: number | null;
  longitude: number | null;
}

interface FormDataState {
  title: string;
  issueDescription: string;
  issueLocation: string;
  issueType: string;
  location: LocationState;
  severityScore?: number;
  urgencyLevel?: string;
}

// A simplified type for the data we extract from EXIF
interface ExtractedExifData {
  make: string | null;
  model: string | null;
  software: string | null;
  dateTime: string | null;
  dateTimeOriginal: string | null;
  dateTimeDigitized: string | null;
  gpsLatitude: string | null;
  gpsLongitude: string | null;
  gpsLatitudeRef: string | null;
  gpsLongitudeRef: string | null;
  gpsAltitude: string | null;
  gpsTimeStamp: string | null;
  exposureTime: string | null;
  fNumber: string | null;
  iso: string | null;
  flash: string | null;
  focalLength: string | null;
  whiteBalance: string | null;
  colorSpace: string | null;
  orientation: string | null;
  thumbnailPresent: boolean;
  rawExif: any; // Keep 'any' as the raw tags object is complex
}

interface GpsCoordinates {
    latitude: number;
    longitude: number;
    altitude: number | null;
    timestamp: string | null;
}

interface SeverityAnalysis {
  score: number;
  level: string;
  reasoning: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface VoiceRecording {
  isRecording: boolean;
  transcript: string;
  translatedText: string;
  detectedLanguage: string;
}


// --- ENHANCED IMAGE VERIFICATION SERVICE ---

class ImageVerificationService {
  static dmsToDecimal(dmsArray: number[], ref: string | null): number | null {
    if (!dmsArray || dmsArray.length !== 3 || !ref) return null;

    const [degrees, minutes, seconds] = dmsArray;
    let decimal = degrees + minutes / 60 + seconds / 3600;

    if (ref === "S" || ref === "W") {
      decimal = -decimal;
    }
    return decimal;
  }

  static async extractExifData(file: File): Promise<ExtractedExifData | null> {
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
        thumbnailPresent: !!(tags.ThumbnailImage || tags["Thumbnail Image"]),
        rawExif: tags,
      };
    } catch (error) {
      console.error("Error extracting EXIF data:", error);
      return null;
    }
  }

  static detectSuspiciousPatterns(file: File, exifData: ExtractedExifData | null) {
    const suspiciousIndicators: string[] = [];
    let suspiciousScore = 0;

    const fileName = file.name.toLowerCase();
    const aiPatterns = ["generated", "ai_generated", "synthetic", "fake", "midjourney", "dalle", "stablediffusion"];
    if (aiPatterns.some((pattern) => fileName.includes(pattern))) {
      suspiciousScore += 50;
      suspiciousIndicators.push("AI-related filename detected");
    }

    if (exifData?.software) {
      const suspiciousSoftware = ["midjourney", "dall-e", "stable diffusion", "ai generated"];
      const softwareLower = exifData.software.toLowerCase();
      if (suspiciousSoftware.some((sw) => softwareLower.includes(sw))) {
        suspiciousScore += 80;
        suspiciousIndicators.push(`Suspicious software detected: ${exifData.software}`);
      }
    }

    if (file.size < 50000) {
      suspiciousScore += 20;
      suspiciousIndicators.push("Unusually small file size");
    }

    if (exifData?.rawExif?.ImageWidth && exifData?.rawExif?.ImageHeight) {
      const width = exifData.rawExif.ImageWidth.value;
      const height = exifData.rawExif.ImageHeight.value;
      const commonAISizes = [512, 768, 1024, 1536, 2048];
      if (commonAISizes.includes(width) && commonAISizes.includes(height)) {
        suspiciousScore += 30;
        suspiciousIndicators.push(`Suspicious dimensions: ${width}x${height}`);
      }
    }

    return {
      isSuspicious: suspiciousScore >= 50,
      indicators: suspiciousIndicators,
    };
  }

  static verifyCameraOrigin(exifData: ExtractedExifData | null, file: File) {
    const suspiciousCheck = this.detectSuspiciousPatterns(file, exifData);
    if (suspiciousCheck.isSuspicious) {
      return {
        isCamera: false,
        confidence: 10,
        reasons: suspiciousCheck.indicators,
        category: "suspicious",
        exifData,
      };
    }

    if (!exifData) {
      return {
        isCamera: true,
        confidence: 50,
        reasons: ["No camera data found, but image appears authentic. Metadata was likely removed during transfer."],
        category: "acceptable",
        exifData,
      };
    }

    const reasons: string[] = [];
    let confidenceScore = 0;

    if (exifData.make && exifData.model) {
      confidenceScore += 40;
      reasons.push(`Camera detected: ${exifData.make} ${exifData.model}`);
    }

    const cameraSettings = [exifData.exposureTime, exifData.fNumber, exifData.iso, exifData.focalLength];
    const settingsPresent = cameraSettings.filter((s) => s !== null).length;
    if (settingsPresent >= 2) {
      confidenceScore += 30;
      reasons.push(`Camera settings found (${settingsPresent} present)`);
    }

    if (exifData.dateTimeOriginal || exifData.dateTime) {
      confidenceScore += 15;
      reasons.push("Original timestamp present");
    }

    if (exifData.gpsLatitude && exifData.gpsLongitude) {
      confidenceScore += 30;
      reasons.push("GPS coordinates embedded");
    }

    if (exifData.software) {
      const editingSoftware = ['Adobe Photoshop', 'GIMP', 'Canva', 'Snapseed', 'Lightroom'];
      const softwareUpper = exifData.software.toUpperCase();
      if (editingSoftware.some(sw => softwareUpper.includes(sw.toUpperCase()))) {
        reasons.push(`Image may have been edited (Software: ${exifData.software})`);
      } else {
        confidenceScore += 10;
        reasons.push(`Camera software detected: ${exifData.software}`);
      }
    }
    
    const finalConfidence = Math.min(100, Math.max(0, confidenceScore));
    let category = "questionable";
    if (finalConfidence >= 80) category = "verified_camera";
    else if (finalConfidence >= 60) category = "likely_camera";
    else if (finalConfidence >= 30) category = "acceptable";

    return {
      isCamera: true,
      confidence: finalConfidence,
      reasons,
      category,
      exifData,
    };
  }

  static extractGPSCoordinates(exifData: ExtractedExifData | null): GpsCoordinates | null {
    if (!exifData?.gpsLatitude || !exifData.gpsLongitude || !exifData.gpsLatitudeRef || !exifData.gpsLongitudeRef) {
      return null;
    }
    try {
      const latDMS = exifData.gpsLatitude.split(',').map(c => eval(c));
      const lngDMS = exifData.gpsLongitude.split(',').map(c => eval(c));
      const latitude = this.dmsToDecimal(latDMS, exifData.gpsLatitudeRef);
      const longitude = this.dmsToDecimal(lngDMS, exifData.gpsLongitudeRef);

      if (latitude === null || longitude === null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        return null;
      }
      return {
        latitude,
        longitude,
        altitude: exifData.gpsAltitude ? parseFloat(exifData.gpsAltitude) : null,
        timestamp: exifData.gpsTimeStamp || null,
      };
    } catch (error) {
      console.error("Error parsing GPS coordinates:", error);
      return null;
    }
  }

  static async verifyAndExtractImageData(file: File) {
    if (!file.type.startsWith("image/")) {
      return {
        isValid: false,
        error: "File is not an image.",
        isCamera: false,
        gpsCoordinates: null,
        confidence: 0,
        reasons: [],
        category: 'invalid',
        exifData: null,
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
      error: null,
    };
  }
}

// --- GEMINI API CONFIG ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";
const GEMINI_API_URL = import.meta.env.VITE_GEMINI_API_URL;

// --- REACT COMPONENT ---
const ReportIssue = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  
  const [formData, setFormData] = useState<FormDataState>({
    title: "",
    issueDescription: "",
    issueLocation: "",
    issueType: "Road Infrastructure",
    location: {
      address: "",
      latitude: null,
      longitude: null,
    },
    severityScore: undefined,
    urgencyLevel: undefined,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [gpsFromImage, setGpsFromImage] = useState(false);
  const [severityAnalysis, setSeverityAnalysis] = useState<SeverityAnalysis | null>(null);
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecording>({
    isRecording: false,
    transcript: "",
    translatedText: "",
    detectedLanguage: ""
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleInputChange = (field: keyof Omit<FormDataState, 'location'>, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = useCallback((lat: number, lng: number, address: string) => {
    setFormData((prev) => ({
      ...prev,
      location: { address, latitude: lat, longitude: lng },
      issueLocation: address,
    }));
    setGpsFromImage(false);
  }, []);

  // Function to automatically get user's location on component mount
  const getInitialUserLocation = useCallback(async () => {
    try {
      if (!navigator.geolocation) {
        console.log("Geolocation is not supported by this browser.");
        return;
      }
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.log("User denied the request for Geolocation.");
              break;
            case error.POSITION_UNAVAILABLE:
              console.log("Location information is unavailable.");
              break;
            case error.TIMEOUT:
              console.log("The request to get user location timed out.");
              break;
            default:
              console.log("An unknown error occurred.");
              break;
          }
          reject(error);
        }, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      
      const { latitude: lat, longitude: lng } = position.coords;
      setUserLocation({ lat, lng });
      
      // Also update the form data with the location
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      const address = data.display_name || "Address not found";
      
      setFormData((prev) => ({
        ...prev,
        location: { address, latitude: lat, longitude: lng },
        issueLocation: address,
      }));
      
      // Show success message
      toast.success("Your location has been detected automatically!");
      
    } catch (error) {
      console.log("Could not get initial user location:", error);
      // Silently fail - user can still manually select location or use the "Use Current" button
    }
  }, []);

  // Get user location on component mount
  useEffect(() => {
    getInitialUserLocation();
  }, [getInitialUserLocation]);

  const captureUserLocation = async () => {
    setLocationLoading(true);
    try {
      toast.info("Getting your current location...");
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser.");
      }
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      const { latitude: lat, longitude: lng } = position.coords;
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      const address = data.display_name || "Address not found";

      setFormData((prev) => ({
        ...prev,
        location: { address, latitude: lat, longitude: lng },
        issueLocation: address,
      }));
      setGpsFromImage(false);
      toast.success("Location captured successfully!");
    } catch (error: any) {
      console.error("Error getting location:", error);
      toast.error(error.message || "Failed to get location.");
    } finally {
      setLocationLoading(false);
    }
  };

  const analyzeImageWithAI = async (file: File) => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
      toast.error("Gemini API key not configured.");
      return;
    }
    setAiAnalyzing(true);
    try {
      toast.info("AI is analyzing your image...");
      const reader = new FileReader();
      const base64Image = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Analyze this image of a civic issue and provide a JSON object with: "title" (string, max 60 chars), "description" (string, 100-300 words), "issueType" (one of: "Road Infrastructure", "Waste Management", "Environmental Issues", "Utilities & Infrastructure", "Public Safety", "Other"), "location" (string, visible landmarks), "severity" (object with "score" (1-10 where 10 is most severe), "level" ("Low", "Medium", "High", "Critical"), "reasoning" (string explaining the severity), "priority" ("Low", "Medium", "High", "Critical")). Consider factors like: flooded roads (9-10), major potholes (7-8), broken streetlights (5-6), litter (2-3), minor cracks (1-2).` },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } },
            ],
          }],
        }),
      });

      if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);
      const data = await response.json();
      const text = data.candidates[0]?.content?.parts[0]?.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No valid JSON response from AI.");
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Update form data with AI analysis including severity
      setFormData((prev) => ({
        ...prev,
        title: analysis.title || prev.title,
        issueDescription: analysis.description || prev.issueDescription,
        issueType: analysis.issueType || prev.issueType,
        issueLocation: prev.location.address || analysis.location || prev.issueLocation,
        severityScore: analysis.severity?.score,
        urgencyLevel: analysis.severity?.level,
      }));
      
      // Set severity analysis for display
      if (analysis.severity) {
        setSeverityAnalysis({
          score: analysis.severity.score,
          level: analysis.severity.level,
          reasoning: analysis.severity.reasoning,
          priority: analysis.severity.priority
        });
      }
      
      toast.success("AI analysis complete! Form auto-filled with severity assessment.");
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      toast.error("Failed to analyze image. Please fill details manually.");
    } finally {
      setAiAnalyzing(false);
    }
  };

  // UPDATED: This function now handles HEIC to JPEG conversion
  const processImage = async (originalFile: File) => {
    let fileToProcess = originalFile;
    const fileNameLower = originalFile.name.toLowerCase();
    const isHeic = originalFile.type === 'image/heic' || originalFile.type === 'image/heif' || fileNameLower.endsWith('.heic') || fileNameLower.endsWith('.heif');
    
    // Convert HEIC/HEIF to JPEG if necessary
    if (isHeic) {
        toast.info("Converting HEIC image, please wait...");
        try {
            const conversionResult = await heic2any({
                blob: originalFile,
                toType: "image/jpeg",
                quality: 0.9,
            });
            const jpegBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
            const newFileName = originalFile.name.replace(/\.(heic|heif)$/i, ".jpg");
            fileToProcess = new File([jpegBlob], newFileName, {
                type: jpegBlob.type,
                lastModified: originalFile.lastModified,
            });
            toast.success("Image converted to JPEG successfully!");
        } catch (error) {
            console.error("HEIC conversion failed:", error);
            toast.error("Failed to convert HEIC image. Please try another format.");
            return;
        }
    }

    // Continue with existing verification logic using the (potentially converted) file
    if (fileToProcess.size > 10 * 1024 * 1024) {
      toast.error("Image size should be less than 10MB.");
      return;
    }
    toast.info("Processing and verifying image...");
    
    const imageData = await ImageVerificationService.verifyAndExtractImageData(fileToProcess);
    if (!imageData.isValid) {
      toast.error(imageData.error || "Invalid image file.");
      return;
    }

    if (!imageData.isCamera) {
      toast.error(`Suspicious image detected (${imageData.confidence}% confidence).`, {
        description: `${imageData.reasons[0]}. Please use an authentic camera photo.`,
        action: { label: "Take Photo", onClick: () => cameraInputRef.current?.click() },
      });
      return;
    }

    setSelectedFile(fileToProcess);
    setImagePreview(URL.createObjectURL(fileToProcess));
    setShowCameraOptions(false);

    toast.success(`Image accepted (${imageData.confidence}% confidence)`, {
        description: imageData.reasons[0],
    });

    if (imageData.gpsCoordinates) {
      setGpsFromImage(true);
      toast.success("GPS location extracted from photo!");
      const { latitude, longitude } = imageData.gpsCoordinates;
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await response.json();
      const address = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setFormData((prev) => ({
        ...prev,
        location: { address, latitude, longitude },
        issueLocation: address,
      }));
      await analyzeImageWithAI(fileToProcess);
    } else {
      setGpsFromImage(false);
      toast.warning("No GPS data found in photo.", {
        description: "Please set the location manually or use your current location.",
        action: { label: "Use Current Location", onClick: () => captureUserLocation() },
      });
      await analyzeImageWithAI(fileToProcess);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await processImage(file);
    // Reset the input value to allow re-uploading the same file
    event.target.value = '';
  };
  
  const handleReanalyze = () => {
    if (selectedFile) {
      setSeverityAnalysis(null);
      analyzeImageWithAI(selectedFile);
    }
  };

  // Voice Recording Functions
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize Speech Recognition if available
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'auto'; // Auto-detect language
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setVoiceRecording(prev => ({
              ...prev,
              transcript: finalTranscript
            }));
            // Auto-translate if needed
            translateText(finalTranscript);
          }
        };
        
        recognitionRef.current.start();
      }
      
      setVoiceRecording(prev => ({ ...prev, isRecording: true }));
      toast.success("Voice recording started. Speak now...");
    } catch (error) {
      console.error('Error starting voice recording:', error);
      toast.error('Failed to start voice recording. Please check microphone permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setVoiceRecording(prev => ({ ...prev, isRecording: false }));
    toast.success("Voice recording stopped.");
  };

  const translateText = async (text: string) => {
    if (!text.trim()) return;
    
    setIsTranslating(true);
    try {
      // Using Google Translate API (you might need to set up your own translation service)
      // For now, we'll use a simple detection and provide the text as-is
      // In a real implementation, you'd integrate with Google Translate API or similar
      
      // Simple language detection (basic implementation)
      const detectedLang = detectLanguage(text);
      
      setVoiceRecording(prev => ({
        ...prev,
        detectedLanguage: detectedLang,
        translatedText: text // In real implementation, this would be translated
      }));
      
      // Auto-fill the description with voice input
      setFormData(prev => ({
        ...prev,
        issueDescription: prev.issueDescription + (prev.issueDescription ? ' ' : '') + text
      }));
      
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Translation failed, but text was added to description.');
    } finally {
      setIsTranslating(false);
    }
  };

  const detectLanguage = (text: string): string => {
    // Simple language detection based on character patterns
    // In a real implementation, you'd use a proper language detection service
    const hindiPattern = /[\u0900-\u097F]/;
    const arabicPattern = /[\u0600-\u06FF]/;
    const chinesePattern = /[\u4e00-\u9fff]/;
    
    if (hindiPattern.test(text)) return 'Hindi';
    if (arabicPattern.test(text)) return 'Arabic';
    if (chinesePattern.test(text)) return 'Chinese';
    return 'English';
  };

  const clearVoiceInput = () => {
    setVoiceRecording({
      isRecording: false,
      transcript: "",
      translatedText: "",
      detectedLanguage: ""
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title || !formData.issueDescription || !formData.location.address) {
      toast.error("Please fill all required fields, including the location.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("You must be logged in to report an issue.");

      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.issueDescription);
      data.append("issueType", formData.issueType);
      data.append("location", JSON.stringify(formData.location));
      
      // Add severity data if available
      if (formData.severityScore) {
        data.append("severityScore", formData.severityScore.toString());
      }
      if (formData.urgencyLevel) {
        data.append("urgencyLevel", formData.urgencyLevel);
      }
      if (severityAnalysis) {
        data.append("severityAnalysis", JSON.stringify(severityAnalysis));
      }
      
      if (selectedFile) data.append("files", selectedFile);
      
      const response = await fetch(`${VITE_BACKEND_URL}/api/v1/citizen/create-issue`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to report issue.");
      
      toast.success("Issue reported successfully!");
      navigate("/citizen");
    } catch (error: any) {
      console.error("Error reporting issue:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const issueTypes = [
    { value: "Road Infrastructure", label: "Road Infrastructure", icon: "🛣️" },
    { value: "Waste Management", label: "Waste Management", icon: "♻️" },
    { value: "Environmental Issues", label: "Environmental Issues", icon: "🌱" },
    { value: "Utilities & Infrastructure", label: "Utilities & Infrastructure", icon: "⚡" },
    { value: "Public Safety", label: "Public Safety", icon: "🛡️" },
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
              variant="ghost" size="sm" onClick={() => setShowCameraOptions(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            > <X className="w-4 h-4" /> </Button>
            
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-green-100">
                  <Camera className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Add Photo</h3>
              <p className="mb-6 text-sm text-gray-600">Upload an authentic photo to help us locate and understand the issue.</p>
              
              <div className="space-y-3">
                <Button onClick={() => cameraInputRef.current?.click()} className="w-full py-3 text-white bg-green-600 hover:bg-green-700 rounded-xl">
                  <Camera className="w-4 h-4 mr-2" /> Take Photo
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full py-3 border-green-200 text-green-700 hover:bg-green-50 rounded-xl">
                  <Upload className="w-4 h-4 mr-2" /> Choose from Gallery
                </Button>
                <div className="flex items-center p-3 border rounded-xl bg-blue-50 border-blue-200">
                  <Shield className="w-4 h-4 mr-2 text-blue-600" />
                  <p className="text-xs text-blue-800">Images are verified for authenticity. GPS data improves accuracy.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Enhanced Professional Header */}
      <header className="sticky top-0 z-40 w-full border-b border-green-200/30 bg-gradient-to-r from-white via-green-50/30 to-white/90 backdrop-blur-xl shadow-sm">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-green-200/20 to-emerald-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-cyan-300/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/2 w-24 h-24 bg-gradient-to-br from-purple-200/20 to-pink-300/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex h-20 items-center justify-between">
            {/* Back Button */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Link to="/citizen">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center space-x-2 text-green-700 hover:text-green-800 hover:bg-gradient-to-r hover:from-green-100/50 hover:to-emerald-100/50 border border-green-200/30 hover:border-green-300/50 rounded-xl px-4 py-2 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <motion.div
                    whileHover={{ x: -3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </motion.div>
                  <span className="font-medium">Back to Dashboard</span>
                </Button>
              </Link>
            </motion.div>
            
            {/* Center Content */}
            <motion.div 
              className="text-center"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              <div className="flex items-center justify-center space-x-3 mb-1">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatDelay: 3,
                    ease: "easeInOut"
                  }}
                  className="p-2 rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-500/20 backdrop-blur-sm border border-green-300/30"
                >
                  <Shield className="w-6 h-6 text-green-600" />
                </motion.div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 via-emerald-600 to-green-800 bg-clip-text text-transparent">
                  Report a New Issue
                </h1>
              </div>
              <motion.p 
                className="text-green-600/90 font-medium text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Help improve your community by reporting infrastructure problems
              </motion.p>
            </motion.div>
            
            {/* Right Spacer */}
            <div className="w-32"></div>
          </div>
        </div>
        
        {/* Bottom Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-300/50 to-transparent"></div>
      </header>

      {/* Main Content */}
      <main className="container relative mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit}>
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 gap-8 mx-auto max-w-7xl xl:grid-cols-2"
        >
          {/* Map Section */}
          <Card className="bg-white/80 backdrop-blur-xl border-green-100 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-green-800">
                <div className="p-2 rounded-lg bg-emerald-100/80"><MapPin className="w-5 h-5 text-emerald-600" /></div>
                <div>
                  <span className="text-lg">Issue Location *</span>
                  <p className="mt-1 text-sm font-normal text-green-700/80">{gpsFromImage ? "Location extracted from photo" : "Click map or use current location"}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden border shadow-inner h-80 rounded-2xl border-green-200/80">
                <MapComponent 
                  onLocationSelect={handleLocationSelect} 
                  initialLat={userLocation?.lat}
                  initialLng={userLocation?.lng}
                />
              </div>

              {locationLoading && <div className="p-3 text-sm text-blue-700 bg-blue-50 rounded-xl">Getting your location...</div>}
              
              {formData.location.address && !locationLoading && (
                  <div className="p-3 space-y-1 border rounded-xl bg-emerald-50 border-emerald-200">
                      <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-emerald-800">{gpsFromImage ? "Photo GPS Location" : "Selected Location"}</p>
                          <Button type="button" size="sm" variant="outline" onClick={captureUserLocation} className="text-xs bg-white/80 border-green-200 text-green-700 hover:bg-green-50" disabled={locationLoading}>
                            <Navigation className="w-3 h-3 mr-1" /> Use Current
                          </Button>
                      </div>
                      <p className="text-sm text-green-800/90">{formData.location.address}</p>
                  </div>
              )}

              {!formData.location.address && !locationLoading && (
                  <div className="p-3 border rounded-xl bg-amber-50 border-amber-200 flex items-center justify-between">
                       <p className="text-sm font-medium text-amber-800">Location Required</p>
                      <Button type="button" size="sm" onClick={captureUserLocation} className="text-xs bg-green-600 text-white hover:bg-green-700">
                        <Navigation className="w-3 h-3 mr-1" /> Get Location
                      </Button>
                  </div>
              )}
            </CardContent>
          </Card>

          {/* Form Section */}
          <div className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-xl border-green-100 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-green-800">
                <div className="p-2 rounded-lg bg-green-100/80"><Shield className="w-5 h-5 text-green-600" /></div>
                <div>
                  <span className="text-lg">Describe the Issue</span>
                  <p className="mt-1 text-sm font-normal text-green-700/80">Provide a photo for AI analysis and auto-fill.</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* File Upload */}
                <div>
                  <Label className="font-medium text-green-800">Issue Photo (Recommended)</Label>
                  <div
                    onClick={() => !(aiAnalyzing || locationLoading) && setShowCameraOptions(true)}
                    className={`mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl transition-all ${
                      (aiAnalyzing || locationLoading) ? "border-green-400 bg-green-50/80 cursor-not-allowed" : "border-green-300/70 bg-green-50/50 hover:bg-green-100/60 hover:border-green-400 cursor-pointer"
                    }`}
                  >
                    {aiAnalyzing || locationLoading ? (
                      <div className="flex flex-col items-center text-green-700"><RefreshCw className="w-8 h-8 animate-spin" /> <p className="mt-2 text-sm font-medium">{aiAnalyzing ? 'AI Analyzing...' : 'Processing GPS...'}</p> </div>
                    ) : (
                      <div className="text-center text-green-700/80">
                        <Camera className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-semibold">Click to add photo</p>
                        <p className="text-xs">GPS Location + AI Analysis</p>
                      </div>
                    )}
                  </div>
                  <Input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                  <Input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" onChange={handleFileChange} className="hidden" />
                </div>
                {selectedFile && (
                  <div className="flex items-center justify-between p-2 mt-2 border rounded-lg bg-green-50 border-green-200">
                    <div className="flex items-center space-x-2 overflow-hidden">
                      {imagePreview && <img src={imagePreview} alt="Preview" className="object-cover w-10 h-10 rounded-md" />}
                      <div>
                        <p className="text-sm text-green-800 truncate">{selectedFile.name}</p>
                        <div className="flex items-center space-x-1.5 text-xs text-green-600"><CheckCircle className="w-3 h-3" /><span>Verified</span>
                          {gpsFromImage && <><span className="text-green-400">•</span><MapPinIcon className="w-3 h-3" /><span>GPS</span></>}
                        </div>
                      </div>
                    </div>
                    {!aiAnalyzing && (
                      <Button type="button" size="sm" variant="outline" onClick={handleReanalyze} className="bg-white/80 border-green-200 text-green-700 hover:bg-green-50 flex-shrink-0">
                        <Sparkles className="w-3 h-3 mr-1" /> Re-analyze
                      </Button>
                    )}
                  </div>
                )}
                
                {/* AI Severity Analysis Display */}
                {severityAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 mt-4 border rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-amber-100">
                        {severityAnalysis.level === 'Critical' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                        {severityAnalysis.level === 'High' && <Zap className="w-5 h-5 text-orange-600" />}
                        {severityAnalysis.level === 'Medium' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                        {severityAnalysis.level === 'Low' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-amber-800">AI Severity Assessment</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              severityAnalysis.level === 'Critical' ? 'bg-red-100 text-red-800' :
                              severityAnalysis.level === 'High' ? 'bg-orange-100 text-orange-800' :
                              severityAnalysis.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {severityAnalysis.level}
                            </span>
                            <span className="text-sm font-bold text-amber-700">{severityAnalysis.score}/10</span>
                          </div>
                        </div>
                        <p className="text-sm text-amber-700">{severityAnalysis.reasoning}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
                {/* Voice Recording Section */}
                <div className="space-y-3">
                  <Label className="font-medium text-green-800">Voice Description (Optional)</Label>
                  <div className="p-4 border rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Languages className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Voice-to-Text with Auto-Translation</span>
                      </div>
                      {voiceRecording.detectedLanguage && (
                        <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                          {voiceRecording.detectedLanguage}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {!voiceRecording.isRecording ? (
                        <Button
                          type="button"
                          onClick={startVoiceRecording}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                          disabled={isTranslating}
                        >
                          <Mic className="w-4 h-4" />
                          <span>Start Recording</span>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={stopVoiceRecording}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg animate-pulse"
                        >
                          <MicOff className="w-4 h-4" />
                          <span>Stop Recording</span>
                        </Button>
                      )}
                      
                      {voiceRecording.transcript && (
                        <Button
                          type="button"
                          onClick={clearVoiceInput}
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          <X className="w-3 h-3 mr-1" /> Clear
                        </Button>
                      )}
                      
                      {isTranslating && (
                        <div className="flex items-center space-x-2 text-blue-600">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Translating...</span>
                        </div>
                      )}
                    </div>
                    
                    {voiceRecording.transcript && (
                      <div className="mt-3 p-3 bg-white/80 rounded-lg border border-blue-100">
                        <div className="flex items-center space-x-2 mb-2">
                          <Volume2 className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Transcribed Text:</span>
                        </div>
                        <p className="text-sm text-gray-700">{voiceRecording.transcript}</p>
                        {voiceRecording.detectedLanguage !== 'English' && voiceRecording.translatedText && (
                          <div className="mt-2 pt-2 border-t border-blue-100">
                            <span className="text-xs font-medium text-blue-600">Auto-added to description</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Issue Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-medium text-green-800">Title *</Label>
                  <Input id="title" type="text" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} placeholder="e.g., Large pothole on Main Street" required className="bg-white/90 border-green-200" />
                </div>
                 {/* Issue Type */}
                <div className="space-y-3">
                    <Label className="font-medium text-green-800">Category *</Label>
                    <RadioGroup value={formData.issueType} onValueChange={(value) => handleInputChange("issueType", value)} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {issueTypes.map((type) => (
                        <div key={type.value}>
                            <RadioGroupItem value={type.value} id={type.value} className="peer sr-only" />
                            <Label htmlFor={type.value} className="flex items-center p-3 space-x-2 border rounded-xl cursor-pointer bg-white/60 border-green-200 hover:bg-green-50 peer-checked:bg-green-100 peer-checked:border-green-400">
                                <span>{type.icon}</span>
                                <span className="text-sm text-green-800">{type.label}</span>
                            </Label>
                        </div>
                    ))}
                    </RadioGroup>
                </div>
                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="issueDescription" className="font-medium text-green-800">Description *</Label>
                  <Textarea id="issueDescription" value={formData.issueDescription} onChange={(e) => handleInputChange("issueDescription", e.target.value)} placeholder="Describe the problem in detail..." required className="min-h-28 bg-white/90 border-green-200" />
                </div>
                 {/* Submit Button */}
                <Button type="submit" size="lg" className="w-full py-3 text-base font-semibold text-white transition-all duration-300 border-0 shadow-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-2xl hover:scale-105 rounded-2xl" disabled={loading || aiAnalyzing || locationLoading}>
                  {loading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Report</>}
                </Button>
            </CardContent>
          </Card>
          </div>
        </motion.div>
        </form>
      </main>
    </motion.div>
  );
};

export default ReportIssue;
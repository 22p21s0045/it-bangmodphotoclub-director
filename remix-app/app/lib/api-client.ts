import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: (typeof process !== "undefined" && process.env && process.env.BACKEND_URL) || "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (status) {
        case 400:
          // Show the actual error message from backend (already in Thai)
          toast.error(message);
          break;
        case 401:
          toast.error("กรุณาเข้าสู่ระบบใหม่");
          // Optionally redirect to login
          // window.location.href = "/login";
          break;
        case 403:
          toast.error("คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้");
          break;
        case 404:
          toast.error("ไม่พบข้อมูลที่ต้องการ");
          break;
        case 500:
          toast.error("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
          break;
        default:
          toast.error(message || "เกิดข้อผิดพลาด");
      }
    } else if (error.request) {
      // Request was made but no response received
      toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } else {
      // Something else happened
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    }

    return Promise.reject(error);
  }
);

// Helper function for manual error handling
export const handleError = (error: unknown, customMessage?: string) => {
  console.error("Error:", error);
  
  if (customMessage) {
    toast.error(customMessage);
    return;
  }

  // If error is already handled by interceptor, don't show duplicate toast
  if (axios.isAxiosError(error)) {
    if (error.response || error.request) {
      return;
    }
  }

  // Handle other types of errors
  const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
  toast.error(message);
};

export default apiClient;

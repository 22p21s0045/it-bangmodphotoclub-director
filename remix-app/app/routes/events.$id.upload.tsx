import { useState } from "react";
import { useParams } from "@remix-run/react";
import axios from "axios";

export default function UploadPage() {
  const { id } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !id) return;
    setUploading(true);

    try {
      // 1. Get Presigned URL
      const { data } = await axios.post('http://localhost:3000/photos/upload-url', {
        filename: file.name,
        eventId: id,
        userId: '1', // Mock user ID
      });

      // 2. Upload to MinIO
      await axios.put(data.url, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      // 3. Notify Backend
      await axios.post('http://localhost:3000/photos', {
        url: data.path,
        filename: file.name,
        eventId: id,
        userId: '1',
      });

      alert('Upload successful!');
    } catch (error) {
      console.error(error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Upload Photo for Event {id}</h1>
      <div className="max-w-md">
        <input type="file" onChange={handleFileChange} className="mb-4 block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100
        "/>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  );
}

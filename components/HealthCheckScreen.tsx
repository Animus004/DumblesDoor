import React, { useState, useRef, useEffect } from 'react';
import type { Pet, HealthCheckResult } from '../types';

interface HealthCheckScreenProps {
  pet: Pet | null;
  onBack: () => void;
  onAnalyze: (imageFile: File, notes: string) => void;
  isChecking: boolean;
  result: HealthCheckResult | null;
  error: string | null;
}

const HealthCheckScreen: React.FC<HealthCheckScreenProps> = ({ pet, onBack, onAnalyze, isChecking, result, error }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    stopCamera(); // Ensure previous stream is stopped
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Could not access camera. Please enable camera permissions for this site in your browser settings.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };
  
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error('Invalid data URL');
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  const handleSubmit = () => {
    if (capturedImage) {
      const imageFile = dataURLtoFile(capturedImage, `${pet?.name || 'pet'}-health-check.jpg`);
      onAnalyze(imageFile, notes);
    }
  };

  const renderContent = () => {
    if (isChecking) {
      return (
        <div className="text-center p-8 flex flex-col items-center justify-center h-full">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div>
          <h3 className="text-xl font-semibold mt-4 text-white">Dumble is analyzing...</h3>
          <p className="text-gray-300">This might take a moment. We're checking for any signs we should pay attention to.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-8 flex flex-col items-center justify-center h-full">
          <div className="text-5xl mb-4">😢</div>
          <h3 className="text-xl font-bold text-red-400">Analysis Failed</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button onClick={onBack} className="bg-teal-500 text-white font-bold py-2 px-6 rounded-lg">Try Again</button>
        </div>
      );
    }

    if (result) {
      return (
        <div className="p-4 md:p-6 overflow-y-auto text-gray-800 bg-white rounded-t-2xl">
          <h3 className="text-2xl font-bold text-center mb-4">Wellness Card for {pet?.name}</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <p><strong>Breed Match:</strong> {result.breed}</p>
            <p><strong>Health Analysis:</strong> {result.healthAnalysis}</p>
            <div>
              <strong>Care Tips:</strong>
              <ul className="list-disc list-inside ml-4">
                {result.careTips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
            {result.vetRecommendation && <div className="p-3 bg-red-100 text-red-800 rounded-lg font-semibold">⚠️ We recommend a quick visit to the vet.</div>}
            {result.groomingRecommendation && <div className="p-3 bg-blue-100 text-blue-800 rounded-lg font-semibold">🛁 A grooming session might be a good idea!</div>}
            {result.productRecommendations.length > 0 && <div>
              <strong>Suggested Products:</strong>
              <div className="flex flex-wrap gap-2 mt-2">
                {result.productRecommendations.map((prod, i) => <span key={i} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">{prod}</span>)}
              </div>
            </div>}
          </div>
          <button onClick={onBack} className="w-full mt-6 bg-teal-500 text-white font-bold py-3 px-4 rounded-lg">Scan Another Photo</button>
        </div>
      );
    }

    if (capturedImage) {
      return (
        <div className="p-4 flex flex-col justify-between h-full">
            <img src={capturedImage} alt="Captured pet" className="w-full max-h-[50vh] object-contain rounded-lg" />
            <div className="mt-4">
                <label htmlFor="notes" className="block text-white text-sm font-bold mb-2">Any specific concerns?</label>
                <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border-gray-500 bg-gray-800 text-white rounded-lg p-2 focus:ring-2 focus:ring-teal-500" placeholder={`e.g., 'He's been scratching his ear a lot.'`}></textarea>
            </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        {cameraError && <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 text-center text-white">{cameraError}</div>}
        <div className="absolute inset-0 border-8 border-white/20 rounded-3xl m-4 pointer-events-none"></div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black z-40 flex flex-col text-white">
      <header className="p-4 flex items-center justify-between flex-shrink-0 z-10">
        <button onClick={onBack} className="text-white bg-black/30 rounded-full p-2 hover:bg-black/50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold">AI Health Check</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-grow relative flex flex-col justify-end">
        {renderContent()}
      </main>

      {!result && !error && (
        <footer className="p-4 flex items-center justify-center gap-8 bg-black/30 backdrop-blur-sm flex-shrink-0 z-10">
          {capturedImage ? (
            <>
              <button onClick={() => { setCapturedImage(null); startCamera(); }} className="text-white font-semibold py-2 px-4">Retake</button>
              <button onClick={handleSubmit} className="bg-teal-500 text-white font-bold py-3 px-8 rounded-full text-lg">Analyze</button>
            </>
          ) : (
            <>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/20 rounded-full" aria-label="Upload from gallery">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
                <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white border-4 border-black/30" aria-label="Capture photo"></button>
                <button onClick={startCamera} className="p-3 bg-white/20 rounded-full" aria-label="Refresh camera">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M20 4v5h-5M4 20v-5h5" /></svg>
                </button>
            </>
          )}
        </footer>
      )}
       <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default HealthCheckScreen;

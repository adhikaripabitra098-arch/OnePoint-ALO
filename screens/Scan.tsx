import React, { useRef, useState, useEffect } from 'react';
import { Screen } from '../components/UI';
import { Camera, Image as ImageIcon, X, Flashlight, FileText } from 'lucide-react';
import { Task, TaskType, TaskStatus } from '../types';

interface ScanProps {
  onNavigate: (screen: string) => void;
  onCreateTask: (task: Task) => void;
}

export const ScanScreen: React.FC<ScanProps> = ({ onNavigate, onCreateTask }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
       try {
         const stream = await navigator.mediaDevices.getUserMedia({ 
             video: { facingMode: 'environment' } 
         });
         if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setHasPermission(true);
         }
       } catch (e) {
         console.warn("Camera access failed", e);
       }
    };
    startCamera();

    return () => {
      // Cleanup tracks
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const capture = () => {
     setIsCapturing(true);
     // Simulate processing
     setTimeout(() => {
        const newTask: Task = {
            id: Math.random().toString(36).substr(2, 9),
            title: `Scanned Receipt #${Math.floor(Math.random() * 1000)}`,
            description: "Processing scanned document for expenses.",
            type: TaskType.GENERAL,
            status: TaskStatus.IN_PROGRESS,
            estimatedCost: 0,
            confidenceScore: 0.8,
            createdAt: new Date()
        };
        onCreateTask(newTask);
        onNavigate('home');
     }, 1500);
  };

  return (
    <Screen hidePadding className="bg-black">
       {/* Camera Viewfinder */}
       <div className="absolute inset-0 z-0">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
       </div>

       {/* UI Overlays */}
       <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 pt-12 pb-10">
          <div className="flex justify-between items-start">
             <button onClick={() => onNavigate('home')} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
                <X size={20} />
             </button>
             <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                <span className="text-xs font-bold text-white uppercase tracking-widest">Receipt Scanner</span>
             </div>
             <button 
                onClick={() => setFlashOn(!flashOn)}
                className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors ${flashOn ? 'bg-yellow-500 text-black' : 'bg-black/40 text-white'}`}
             >
                <Flashlight size={20} />
             </button>
          </div>

          {/* Guide Box */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-[3/4] border-2 border-white/30 rounded-3xl overflow-hidden">
             <div className="absolute inset-0 bg-scan-line animate-scan opacity-20 pointer-events-none" />
             
             {/* Corner Markers */}
             <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-xl -mt-[2px] -ml-[2px]" />
             <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-xl -mt-[2px] -mr-[2px]" />
             <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-xl -mb-[2px] -ml-[2px]" />
             <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-xl -mb-[2px] -mr-[2px]" />
             
             <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded">Align document</span>
             </div>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-around">
             <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                <ImageIcon size={20} className="text-white" />
             </button>

             <button 
               onClick={capture}
               disabled={isCapturing}
               className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all ${isCapturing ? 'scale-90 bg-white' : 'bg-transparent'}`}
             >
                <div className={`w-16 h-16 rounded-full bg-white transition-transform ${isCapturing ? 'scale-90' : 'scale-100'}`} />
             </button>

             <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                 <FileText size={20} className="text-white" />
             </button>
          </div>
       </div>
    </Screen>
  );
};
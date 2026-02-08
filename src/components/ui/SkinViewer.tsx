import React, { useEffect, useRef } from 'react';
import { SkinViewer as SkinViewer3D, WalkingAnimation, IdleAnimation, RotatingAnimation } from 'skinview3d';

interface SkinViewerProps {
  skinUrl?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export const SkinViewer: React.FC<SkinViewerProps> = ({ 
  skinUrl = 'https://textures.minecraft.net/texture/31f477eb1a7b83f53c852ebe45056fb491626f55567303310023d537a85d2', // Steve skin
  width = '100%',
  height = '100%',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer3D | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize the viewer
    const viewer = new SkinViewer3D({
      canvas: canvasRef.current,
      width: 300, // Initial size, will be controlled by resize observer
      height: 400,
      skin: skinUrl
    });

    viewerRef.current = viewer;

    // Configure viewer
    viewer.fov = 70;
    viewer.zoom = 0.9;
    viewer.autoRotate = true;
    viewer.autoRotateSpeed = 0.5;
    
    // Add animation
    viewer.animation = new WalkingAnimation();
    // Alternatively: viewer.animation = new IdleAnimation();

    // Responsive handling
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === canvasRef.current?.parentElement) {
          const { width, height } = entry.contentRect;
          viewer.setSize(width, height);
        }
      }
    });

    if (canvasRef.current.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }

    return () => {
      viewer.dispose();
      resizeObserver.disconnect();
    };
  }, []);

  // Update skin when prop changes
  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.loadSkin(skinUrl);
    }
  }, [skinUrl]);

  return (
    <div className={`w-full h-full relative ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full outline-none"
        style={{ imageRendering: 'pixelated' }} // Ensure crisp pixels
      />
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
        <span className="text-xs text-text-secondary bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
          Левая кнопка мыши - Вращение
        </span>
      </div>
    </div>
  );
};

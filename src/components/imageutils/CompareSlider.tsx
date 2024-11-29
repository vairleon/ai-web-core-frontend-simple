import {
  ReactCompareSlider,
  ReactCompareSliderImage,
  ReactCompareSliderHandle,
} from 'react-compare-slider';
import { useState, useRef, useCallback, useEffect } from 'react';

export const CompareSlider = ({
  original,
  processed,
  zoom = 1,
  width = 800,
  height = 500,
}: {
  original: string;
  processed: string;
  zoom: number;
  width?: number;
  height?: number;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // 监听 zoom 变化，当 zoom 回到 1 时重置位置
  useEffect(() => {
    if (zoom <= 1) {
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    e.preventDefault();
    
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;
    
    // 计算边界
    const maxX = (width * (zoom - 1)) / 2;
    const maxY = (height * (zoom - 1)) / 2;
    
    setPosition({
      x: Math.max(Math.min(newX, maxX), -maxX),
      y: Math.max(Math.min(newY, maxY), -maxY)
    });
  }, [isDragging, zoom, startPos, width, height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove as any);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 添加平滑过渡效果的样式
  const transitionStyle = zoom <= 1 ? 'transform 0.3s ease-out' : (isDragging ? 'none' : 'transform 0.3s');

  return (
    <div 
      className="overflow-hidden rounded-lg"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <ReactCompareSlider
        boundsPadding={0}
        itemOne={
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#fff',
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: transitionStyle
          }}>
            <ReactCompareSliderImage 
              src={original} 
              alt="Original photo"
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                backgroundColor: '#fff',
                pointerEvents: 'none',
              }}
            />
          </div>
        }
        itemTwo={
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#fff',
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: transitionStyle
          }}>
            <ReactCompareSliderImage 
              src={processed} 
              alt="Processed photo"
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                backgroundColor: '#fff',
                pointerEvents: 'none',
              }}
            />
          </div>
        }
        position={50}
        handle={
          <ReactCompareSliderHandle
            buttonStyle={{
              width: '12px',
              height: '12px',
              border: '2px solid white',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(4px)',
              cursor: 'col-resize',
              boxShadow: '0 0 4px rgba(0,0,0,0.5)',
            }}
            linesStyle={{
              width: '1px',
              background: 'white',
              boxShadow: '0 0 4px rgba(0,0,0,0.5)',
            }}
          />
        }
        onlyHandleDraggable={true}
        style={{
          height: `${height}px`,
          width: `${width}px`,
        }}
      />
    </div>
  );
};

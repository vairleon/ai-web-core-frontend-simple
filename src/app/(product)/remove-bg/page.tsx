'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/utils/api';
import { Task } from '@/types/api';
import Header from '@/components/removebg/Header';
import Footer from '@/components/removebg/Footer';
import { CompareSlider } from '@/components/imageutils/CompareSlider';
import { Tooltip } from '@/components/imageutils/Tooltip';
import SquigglyLines from '@/components/removebg/SquigglyLines';
import Head from 'next/head';
import { Rnd } from 'react-rnd'; // 导入 Rnd 组件
import Feedback from '@/components/removebg/Feedback';
import { useLanguage } from '@/contexts/LanguageContext';


interface TemplateDataSchema {
  imageUrl: string;
}

interface TemplateResultSchema {
  imageUrl: string;
}

// const TemplateId:string = '0';
const TemplateName:string = 'removebg';

// Constants
const CONTAINER_WIDTH = 800;
const CONTAINER_HEIGHT = 600;
const MAX_DISPLAY_SIZE = 500;
const VISIBLE_ITEMS = 5;
const ZOOM_STEP = 0.2;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const LONG_PRESS_DELAY = 200;
const POLLING_INTERVAL = 2000;
const MIN_COLOR_VALUE = 0;
const MAX_COLOR_VALUE = 200;
const DEFAULT_COLOR_VALUE = 100;
const DEFAULT_SATURATION = 110;
const MIN_RESIZE_WIDTH = 50;
const MIN_RESIZE_HEIGHT = 50;
const TEMPLATE_ITEM_WIDTH = 80;
const TEMPLATE_GAP = 16;
const SLIDER_ITEM_OFFSET = TEMPLATE_ITEM_WIDTH + TEMPLATE_GAP;

// Helper function to load images
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export default function RemoveBackgroundAction() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('/example.png');
  const [resultUrl, setResultUrl] = useState<string>('/removed_bg.png');
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [showCompareSlider, setShowCompareSlider] = useState(false);
  const [activeTab, setActiveTab] = useState('original'); // 'original', 'compare', 'background', 'color', 'effects'
  const [downloadReady, setDownloadReady] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState('/templates/white-bg.jpg');
  const [imageScale, setImageScale] = useState(100);
  const [colorAdjustments, setColorAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });
  const [selectedEffect, setSelectedEffect] = useState('none');
  const [zoomLevel, setZoomLevel] = useState(1);
  // const [viewportPosition, setViewportPosition] = useState({ x: 0, y: 0 });
  const [backgroundImages] = useState([
    '/example.png',
    '/example.png',
    '/example.png',
    '/example.png',
    '/example.png',
    '/example.png',
    '/example.png',
    '/example.png',
  ]);

  // 添加图片尺寸状态
  const [imageDimensions, setImageDimensions] = useState({
    width: MAX_DISPLAY_SIZE,
    height: MAX_DISPLAY_SIZE
  });

  const [resizedImageDimensions, setResizedImageDimensions] = useState({
    width: imageDimensions.width,
    height: imageDimensions.height
  });

  const [originalImageDimensions, setOriginalImageDimensions] = useState({
    width: imageDimensions.width,
    height: imageDimensions.height
  });

  const [centerPosition, setCenterPosition] = useState({ x: 0, y: 0 });

  const [isReset, setIsReset] = useState(false);

  // 计算适应容器的图片尺寸
  const calculateAspectRatio = (width: number, height: number) => {
    if (width > height) {
      const newWidth = Math.min(width, MAX_DISPLAY_SIZE);
      const newHeight = Math.round((height * newWidth) / width);
      return { width: newWidth, height: newHeight };
    } else {
      const newHeight = Math.min(height, MAX_DISPLAY_SIZE);
      const newWidth = Math.round((width * newHeight) / height);
      return { width: newWidth, height: newHeight };
    }
  };

  // 添加计算中心位置的函数
  const calculateCenterPosition = (containerWidth: number, containerHeight: number, imageWidth: number, imageHeight: number) => {
    return {
      x: (containerWidth - imageWidth) / 2,
      y: (containerHeight - imageHeight) / 2
    };
  };

  // 初始化时使用中心位置
  const [viewportPosition, setViewportPosition] = useState(() => 
    calculateCenterPosition(CONTAINER_WIDTH, CONTAINER_HEIGHT, MAX_DISPLAY_SIZE, MAX_DISPLAY_SIZE)
  );

  const handleFileAndUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // 创建图片对象以获取尺寸
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file as Blob);
      
      img.onload = async () => {
        // 计算适应容器的尺寸
        const newDimensions = calculateAspectRatio(img.width, img.height);
        setImageDimensions(newDimensions);
        setOriginalImageDimensions(newDimensions);
        setResizedImageDimensions(newDimensions);

        // 计算新的中心位置
        const centerPosition = calculateCenterPosition(CONTAINER_WIDTH, CONTAINER_HEIGHT, newDimensions.width, newDimensions.height);
        setViewportPosition(centerPosition);
        setCenterPosition(centerPosition);
        
        setSelectedFile(file);
        setPreviewUrl(objectUrl);
        setLoading(true);
        setError(null);

        try {
          // Upload and process
          const uploadResult = await api.uploadImage(file);
          const taskData: TemplateDataSchema = {
            imageUrl: uploadResult.url
          };

          const newTask = await api.createTask({
            name: 'Remove Background',
            data: JSON.stringify(taskData),
            templateName: TemplateName,
          });
          
          setTask(newTask);
          pollTaskStatus(newTask.id);
        } catch (err: any) {
          setError(err.message || 'Failed to process image');
          setLoading(false);
        }
      };

      img.src = objectUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to load image');
      setLoading(false);
    }
  };

  const pollTaskStatus = async (taskId: number) => {
    try {
      const taskStatus = await api.getTaskById(taskId);
      
      if (taskStatus.status === 'success' && taskStatus.resultData) {
        const resultData = JSON.parse(taskStatus.resultData) as TemplateResultSchema;
        const imageUrl = resultData.imageUrl;

        // 创建离屏 canvas 来分析图片
        const calculateBoundingBox = (img: HTMLImageElement): { x: number, y: number, width: number, height: number } => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get canvas context');

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          let minX = canvas.width;
          let minY = canvas.height;
          let maxX = 0;
          let maxY = 0;

          // 扫描所有像素寻找非透明区域的边界
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const index = (y * canvas.width + x) * 4;
              const r = data[index];
              const g = data[index + 1];
              const b = data[index + 2];
              const alpha = data[index + 3];
              
              // 检查是否为非透明像素（RGB 不全为 0 或 alpha 不为 0）
              if ((r > 0 || g > 0 || b > 0) || alpha > 0) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }
          }

          // 添加小边距
          const padding = 0;
          minX = Math.max(0, minX - padding);
          minY = Math.max(0, minY - padding);
          maxX = Math.min(canvas.width, maxX + padding);
          maxY = Math.min(canvas.height, maxY + padding);

          return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
          };
        };

        // 为 Background 和 Color Adjustment 视图创建裁剪版本
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            // 计算边界框
            const boundingBox = calculateBoundingBox(img);
            
            // 创建裁剪版本
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Failed to get canvas context');

            canvas.width = boundingBox.width;
            canvas.height = boundingBox.height;
            
            ctx.drawImage(
              img,
              boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height,
              0, 0, boundingBox.width, boundingBox.height
            );

            canvas.toBlob((blob) => {
              if (!blob) throw new Error('Failed to create blob');
              const croppedUrl = URL.createObjectURL(blob);
              
              // 更新状态，但保持原始 resultUrl 不变
              setResultUrl(imageUrl); // 原始图片用于 Compare 视图
              setCroppedResultUrl(croppedUrl); // 新增状态用于 Background 和 Color 视图
              
              // 更新裁剪后的尺寸
              const newDimensions = calculateAspectRatio(boundingBox.width, boundingBox.height);
              setResizedImageDimensions(newDimensions); // 新增状态
        
              setLoading(false);
              setDownloadReady(true);

              // 更新裁剪版本的中心位置
              const centerPosition = calculateCenterPosition(CONTAINER_WIDTH, CONTAINER_HEIGHT, newDimensions.width, newDimensions.height);
              setViewportPosition(centerPosition); // 新增状态
            }, 'image/png');

          } catch (error) {
            console.error('Error processing image:', error);
            setError('Failed to process image');
            setLoading(false);
          }
        };

        img.src = imageUrl;
      } else if (taskStatus.status === 'failed') {
        setError('Task processing failed');
        setResultUrl('/error-image.png');
        setLoading(false);
      } else if (['init', 'queueing', 'pending', 'running'].includes(taskStatus.status)) {
        setTimeout(() => pollTaskStatus(taskId), POLLING_INTERVAL);
      }
    } catch (err) {
      console.error('Error in pollTaskStatus:', err);
      setError('Failed to check task status');
      setLoading(false);
    }
  };

  const toolboxItems = [
    {
      name: 'Original View',
      icon: '🖼️',
      action: () => setActiveTab('original'),
      id: 'original'
    },
    {
      name: 'Compare View',
      icon: '🔄',
      action: () => setActiveTab('compare'),
      id: 'compare'
    },
    {
      name: 'Change Background',
      icon: '🎆',
      action: () => setActiveTab('background'),
      id: 'background'
    },
    {
      name: 'Adjust Colors',
      icon: '🎨',
      action: () => setActiveTab('color'),
      id: 'color'
    },
    {
      name: 'Add Effects',
      icon: '✨',
      action: () => setActiveTab('effects'),
      id: 'effects'
    }
  ];

  // 添加新的状态来存储原始的 boundingBox
  const [originalBoundingBox, setOriginalBoundingBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // 添加新的状态
  const [isSelected, setIsSelected] = useState(false);

  // 添加点击事件处理函数
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // 如果点击的是背景，取消选中状态
    if (e.target === e.currentTarget) {
      setIsSelected(false);
    }
  };

  // 在组件中添加全局点击事件监听
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // 检查点击是否在编辑区域外
      const editArea = document.getElementById('edit-area');
      if (editArea && !editArea.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // 添加当前显示的起始索引状态
  const [currentIndex, setCurrentIndex] = useState(0);

  // 在组件顶部添加新的状态
  const [croppedResultUrl, setCroppedResultUrl] = useState<string>(resultUrl);

  // 添加自动调色函数
  const autoAdjustColors = () => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 计算平均亮度和对比度
      let totalBrightness = 0;
      let totalPixels = 0;
      let minBrightness = 255;
      let maxBrightness = 0;

      for (let i = 0; i < data.length; i += 4) {
        // 跳过完全透明的像素
        if (data[i + 3] < 10) continue;

        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
        totalPixels++;
        
        minBrightness = Math.min(minBrightness, brightness);
        maxBrightness = Math.max(maxBrightness, brightness);
      }

      const avgBrightness = totalBrightness / totalPixels;
      const contrastRange = maxBrightness - minBrightness;

      // 计算建议的调整值
      const suggestedBrightness = Math.round((128 - avgBrightness) * 0.8 + DEFAULT_COLOR_VALUE);
      const suggestedContrast = Math.round((255 / contrastRange) * 100);
      const suggestedSaturation = DEFAULT_SATURATION; // 略微提高饱和度

      // 更新颜色调整状态
      setColorAdjustments({
        brightness: suggestedBrightness,
        contrast: suggestedContrast,
        saturation: suggestedSaturation,
      });
    };

    // img.src = resultUrl;
    img.src = selectedBackground;
  };

  // 添加合成和下载函数
  const downloadComposedImage = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸为背景尺寸
    canvas.width = 800;  // 背景宽度
    canvas.height = 600; // 背景高度

    try {
      // 绘制背景
      const bgImg = await loadImage(selectedBackground);
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      // 绘制前景图片（考虑位置和尺寸）
      const fgImg = await loadImage(resultUrl);
      
      // 应用颜色调整
      ctx.filter = `brightness(${colorAdjustments.brightness}%) 
                    contrast(${colorAdjustments.contrast}%) 
                    saturate(${colorAdjustments.saturation}%)`;

      // 计算裁剪区域
      const drawX = viewportPosition.x;
      const drawY = viewportPosition.y;
      const drawWidth = resizedImageDimensions.width;
      const drawHeight = resizedImageDimensions.height;

      // 计算与画布的交叉区域
      const intersectX = Math.max(0, drawX);
      const intersectY = Math.max(0, drawY);
      const intersectRight = Math.min(canvas.width, drawX + drawWidth);
      const intersectBottom = Math.min(canvas.height, drawY + drawHeight);
      
      // 只绘制在画布范围内的部分
      if (intersectRight > intersectX && intersectBottom > intersectY) {
        const sourceX = (intersectX - drawX) / drawWidth * fgImg.width;
        const sourceY = (intersectY - drawY) / drawHeight * fgImg.height;
        const sourceWidth = (intersectRight - intersectX) / drawWidth * fgImg.width;
        const sourceHeight = (intersectBottom - intersectY) / drawHeight * fgImg.height;

        ctx.drawImage(
          fgImg,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          intersectX,
          intersectY,
          intersectRight - intersectX,
          intersectBottom - intersectY
        );
      }

      // 重置滤镜
      ctx.filter = 'none';

      // 转换为 blob 并下载
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'composed-image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');

    } catch (error) {
      console.error('Error composing image:', error);
      setError('Failed to compose image');
    }
  };

  // 添加一个 key 状态来强制重新渲染文件输入
  const [uploadKey, setUploadKey] = useState(0);

  // 修改背景图片上传处理函数
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newUrl = URL.createObjectURL(file);
      setSelectedBackground(newUrl);
      
      // 重置文件输入
      e.target.value = '';
      // 更新 key 以允许重新上传相同文件
      setUploadKey(prev => prev + 1);
    }
  };

  //
  return (
    <div className='flex max-w-6xl mx-auto flex-col items-center justify-center py-2 min-h-screen'>
      <Head>
        <title>Remove Background</title>
      </Head>
      <Header />
      <main className='flex flex-1 py-5 w-full flex-col items-center justify-center text-center px-4 mt-12'>
        {/* Title Section */}
        <h1 className='mx-auto max-w-4xl font-display text-5xl font-bold tracking-normal text-slate-900 sm:text-7xl mb-8'>
          Auto remove background{' '}
          <span className='relative whitespace-nowrap text-[#3290EE]'>
            <SquigglyLines />
            <span className='relative'>using AI</span>
          </span>{' '}
          <span className="block">for everyone.</span>
        </h1>

        {/* Action Buttons */}
        <div className='flex justify-center mt-12 items-center gap-4 mb-12'>
          <Link
            href='/dashboard/products'
            className='bg-white border border-gray-300 rounded-lg text-black font-medium px-6 py-2.5 hover:bg-gray-100 transition-colors'
          >
            See Other Products
          </Link>
          <button
            onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
            className='bg-black rounded-lg text-white font-medium px-6 py-2.5 hover:bg-black/80 transition-colors'
            disabled={loading}
          >
            Remove Background
          </button>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileAndUpload}
            disabled={loading}
          />
        </div>

        {/* Main content area with increased size */}
        <div className="relative w-full max-w-16xl min-h-[600px] my-8"> {/* Increased size */}
          {/* Toolbar */}
          <div className="absolute right-0 top-0 z-10">
            <div className="bg-white shadow-lg rounded-lg p-1 transition-all duration-300 w-12 hover:w-48 group">
              <div className="flex items-center p-1">
                <span className="text-lg">🛠️</span>
                <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Edit Tools
                </span>
              </div>
              <hr className="border-t border-gray-150 my-1" />
              <div className="overflow-hidden">
                {toolboxItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className={`flex items-center w-full p-1.5 hover:bg-gray-100 rounded transition-colors ${
                      activeTab === item.id ? 'bg-gray-100' : ''
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div> 
            </div>
          </div>

          {/* Sliding content area */}
          <div className="overflow-hidden h-full">
            <div className="flex transition-transform duration-300 h-full"
                 style={{ transform: `translateX(-${toolboxItems.findIndex(item => item.id === activeTab) * 100}%)` }}>
              
              {/* Original View */}
              <div className="min-w-full">
                <div className="flex justify-center gap-8">
                  <div className="relative" style={{ width: imageDimensions.width, height: imageDimensions.height }}>
                    <Image 
                      src={previewUrl} 
                      alt="Original" 
                      width={imageDimensions.width}
                      height={imageDimensions.height}
                      className="rounded-lg object-contain"
                    />
                  </div>
                  <div className="relative" style={{ width: imageDimensions.width, height: imageDimensions.height }}>
                    <Image 
                      src={resultUrl} 
                      alt="Result" 
                      width={imageDimensions.width}
                      height={imageDimensions.height}
                      className="rounded-lg object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Compare View with Zoom Controls */}
              <div className="min-w-full">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative" style={{ 
                    width: imageDimensions.width, 
                    height: imageDimensions.height,
                    maxWidth: '800px'  // 确保不会超过容器
                  }}>
                    <CompareSlider 
                      original={previewUrl} 
                      processed={resultUrl} 
                      zoom={zoomLevel}
                      width={imageDimensions.width}
                      height={imageDimensions.height}
                    />
                  </div>
                  {/* Zoom controls moved below */}
                  <div className="flex items-center gap-8 mt-8">
                    <button 
                      onClick={() => setZoomLevel(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM))}
                      className="bg-white p-2 rounded-lg shadow hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm">🔍 Zoom Out</span>
                    </button>
                    <div className="text-sm text-gray-600">
                      {Math.round(zoomLevel * 100)}%
                    </div>
                    <button 
                      onClick={() => setZoomLevel(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM))}
                      className="bg-white p-2 rounded-lg shadow hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm">🔍 Zoom In</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Background Change View */}
              <div className="min-w-full">
                <div className="flex flex-col items-center gap-4">
                  <div 
                    id="edit-area"
                    className="relative w-[800px] h-[600px] bg-gray-50 rounded-lg overflow-hidden"
                    onClick={handleBackgroundClick}
                  >
                    {/* Background Image */}
                    <Image 
                      src={selectedBackground} 
                      alt="Background" 
                      fill
                      className="object-cover rounded-lg"
                    />
                    
                    {/* Draggable/Resizable Foreground Container */}
                    <Rnd
                      default={{
                        x: viewportPosition.x,
                        y: viewportPosition.y,
                        width: resizedImageDimensions.width,
                        height: resizedImageDimensions.height
                      }}
                      position={{ x: viewportPosition.x, y: viewportPosition.y }}
                      size={{ 
                        width: resizedImageDimensions.width, 
                        height: resizedImageDimensions.height 
                      }}
                      onDragStop={(e, d) => {
                        setViewportPosition({ x: d.x, y: d.y });
                      }}
                      minWidth={MIN_RESIZE_WIDTH}
                      minHeight={MIN_RESIZE_HEIGHT}
                      enableResizing={isSelected ? {
                        top: true,
                        right: true,
                        bottom: true,
                        left: true,
                        topRight: true,
                        bottomRight: true,
                        bottomLeft: true,
                        topLeft: true
                      } : false}
                      dragHandleClassName="drag-handle"
                      disableDragging={!isSelected}
                      onResize={(e, direction, ref, delta, position) => {
                        const newWidth = ref.offsetWidth;
                        const newHeight = ref.offsetHeight;
                        // const aspectRatio = originalImageDimensions.width / originalImageDimensions.height;
                        const aspectRatio = resizedImageDimensions.width / resizedImageDimensions.height;

                        // 检查是否是角点拖动
                        const isCornerResize = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].includes(direction);

                        if (isCornerResize) {
                          // 角点拖动时保持长宽比
                          const adjustedHeight = newWidth / aspectRatio;
                          setResizedImageDimensions({
                            width: newWidth,
                            height: adjustedHeight
                          });
                          
                          // 更新位置以保持正确的对齐
                          if (direction.includes('top')) {
                            position.y = position.y + (newHeight - adjustedHeight);
                          }
                        } else {
                          // 边缘拖动时自由调整
                          setResizedImageDimensions({
                            width: newWidth,
                            height: newHeight
                          });
                        }
                        
                        setViewportPosition(position);
                      }}
                      onResizeStop={(e, direction, ref, delta, position) => {
                        const newWidth = ref.offsetWidth;
                        const newHeight = ref.offsetHeight;
                        // const aspectRatio = originalImageDimensions.width / originalImageDimensions.height;
                        const aspectRatio = resizedImageDimensions.width / resizedImageDimensions.height;

                        // 检查是否是角点拖动
                        const isCornerResize = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].includes(direction);

                        if (isCornerResize) {
                          // 角点拖动时保持长宽比
                          setResizedImageDimensions({
                            width: newWidth,
                            height: newWidth / aspectRatio
                          });
                        } else {
                          // 边缘拖动时保持当前尺寸
                          setResizedImageDimensions({
                            width: newWidth,
                            height: newHeight
                          });
                        }
                        
                        setViewportPosition(position);
                      }}
                      resizeHandleStyles={{
                        top: { cursor: 'n-resize' },
                        right: { cursor: 'e-resize' },
                        bottom: { cursor: 's-resize' },
                        left: { cursor: 'w-resize' },
                        topRight: { cursor: 'ne-resize' },
                        bottomRight: { cursor: 'se-resize' },
                        bottomLeft: { cursor: 'sw-resize' },
                        topLeft: { cursor: 'nw-resize' }
                      }}
                    >

                      <div 
                        className={`w-full h-full ${isSelected ? 'border-2 border-blue-500 border-dashed' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation(); // 防止事件冒泡到背景
                          setIsSelected(true);
                        }}
                      >
                        <Image 
                          src={croppedResultUrl} 
                          alt="Result" 
                          fill
                          className="object-fill rounded-lg" // 改为 object-fill 以填充整个容器
                          draggable={false} // 防止图片被拖动
                        />
                        <div 
                          className="absolute inset-0 drag-handle" // 添加拖动句柄
                          onMouseDown={(e) => {
                            // 只在长按时启用拖动
                            const timeout = setTimeout(() => {
                              setIsSelected(true);
                            }, LONG_PRESS_DELAY); // 200ms 的长按阈值

                            const handleMouseUp = () => {
                              clearTimeout(timeout);
                              window.removeEventListener('mouseup', handleMouseUp);
                            };

                            window.addEventListener('mouseup', handleMouseUp);
                          }}
                        >
                        </div>
                      </div>
                    </Rnd>
                  </div>

                  {/* Background Templates Slider */}
                  <div className="w-full max-w-[800px] relative">
                    <div className="flex items-center justify-center gap-4">
                      {/* 左箭头 */}
                      <button
                        onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
                        disabled={currentIndex === 0}
                        className={`p-2 rounded-full ${currentIndex === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Templates Container with Animation */}
                      <div className="overflow-hidden w-[580px]"> {/* 5 items * (80px width + 16px gap) */}
                        <div 
                          className="flex gap-4 transition-transform duration-300 ease-in-out"
                          style={{ transform: `translateX(-${currentIndex * SLIDER_ITEM_OFFSET}px)` }} // 96px = 80px(width) + 16px(gap)
                        >
                          {backgroundImages.map((bg, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedBackground(bg)}
                              className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 hover:border-blue-500 transition-colors"
                            >
                              <Image 
                                src={bg} 
                                alt={`Background ${index + 1}`} 
                                fill 
                                className="object-cover"
                              />
                            </button>
                          ))}
                          {/* 添加本地图片按钮 */}
                          <label className="relative shrink-0 flex items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleBackgroundUpload}
                            />
                            <div className="flex flex-col items-center">
                              <span className="text-2xl text-gray-400">+</span>
                              <span className="text-xs text-gray-400 mt-1">Upload</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* 右箭头 */}
                      <button
                        onClick={() => setCurrentIndex(prev => Math.min(prev + 1, backgroundImages.length - VISIBLE_ITEMS + 1))} // +1 for upload button
                        disabled={currentIndex >= backgroundImages.length - VISIBLE_ITEMS + 1}
                        className={`p-2 rounded-full ${
                          currentIndex >= backgroundImages.length - VISIBLE_ITEMS + 1
                            ? 'text-gray-300' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Adjustment View */}
              <div className="min-w-full">
                <div className="flex flex-col items-center gap-4">
                  {/* Main Content Area */}
                  <div className={`relative w-[${CONTAINER_WIDTH}px] h-[${CONTAINER_HEIGHT}px] bg-gray-50 rounded-lg overflow-hidden`}>
                    <Image 
                      src={selectedBackground} 
                      alt="Background" 
                      fill 
                      className="object-cover rounded-lg"
                    />
                    <Rnd
                      position={{ x: viewportPosition.x, y: viewportPosition.y }}
                      size={{ 
                        width: resizedImageDimensions.width, 
                        height: resizedImageDimensions.height 
                      }}
                      onDragStop={(e, d) => {
                        setViewportPosition({ x: d.x, y: d.y });
                      }}
                      minWidth={MIN_RESIZE_WIDTH}
                      minHeight={MIN_RESIZE_HEIGHT}
                      enableResizing={isSelected ? {
                        top: true,
                        right: true,
                        bottom: true,
                        left: true,
                        topRight: true,
                        bottomRight: true,
                        bottomLeft: true,
                        topLeft: true
                      } : false}
                      dragHandleClassName="drag-handle"
                      disableDragging={!isSelected}
                      onResize={(e, direction, ref, delta, position) => {
                        const newWidth = ref.offsetWidth;
                        const newHeight = ref.offsetHeight;
                        const aspectRatio = originalImageDimensions.width / originalImageDimensions.height;

                        // 检查是否是角点拖动
                        const isCornerResize = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].includes(direction);

                        if (isCornerResize) {
                          // 角点拖动时保持长宽比
                          const adjustedHeight = newWidth / aspectRatio;
                          setResizedImageDimensions({
                            width: newWidth,
                            height: adjustedHeight
                          });
                          
                          // 更新位置以保持正确的对齐
                          if (direction.includes('top')) {
                            position.y = position.y + (newHeight - adjustedHeight);
                          }
                        } else {
                          // 边缘拖动时自由调整
                          setResizedImageDimensions({
                            width: newWidth,
                            height: newHeight
                          });
                        }
                        
                        setViewportPosition(position);
                      }}
                      onResizeStop={(e, direction, ref, delta, position) => {
                        const newWidth = ref.offsetWidth;
                        const newHeight = ref.offsetHeight;
                        const aspectRatio = originalImageDimensions.width / originalImageDimensions.height;

                        // 检查是否是角点拖动
                        const isCornerResize = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].includes(direction);

                        if (isCornerResize) {
                          // 角点拖动时保持长宽比
                          setResizedImageDimensions({
                            width: newWidth,
                            height: newWidth / aspectRatio
                          });
                        } else {
                          // 边缘拖动时保持当前尺寸
                          setResizedImageDimensions({
                            width: newWidth,
                            height: newHeight
                          });
                        }
                        
                        setViewportPosition(position);
                      }}
                    >
                      <div 
                        className={`w-full h-full ${isSelected ? 'border-2 border-blue-500 border-dashed' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSelected(true);
                        }}
                      >
                        <Image 
                          src={croppedResultUrl} 
                          alt="Result" 
                          fill
                          className="object-fill rounded-lg"
                          draggable={false}
                          style={{ 
                            filter: `brightness(${colorAdjustments.brightness}%) 
                                    contrast(${colorAdjustments.contrast}%) 
                                    saturate(${colorAdjustments.saturation}%)`
                          }}
                        />
                        <div className="absolute inset-0 drag-handle" />
                      </div>

                      {/* Optional: Add visual indicator for clipped areas */}
                      {isSelected && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div 
                            className="absolute bg-black/20 transition-all duration-200" 
                            style={{
                              left: viewportPosition.x < 0 ? '0' : undefined,
                              top: viewportPosition.y < 0 ? '0' : undefined,
                              right: (viewportPosition.x + resizedImageDimensions.width) > CONTAINER_WIDTH ? '0' : undefined,
                              bottom: (viewportPosition.y + resizedImageDimensions.height) > CONTAINER_HEIGHT ? '0' : undefined,
                              width: viewportPosition.x < 0 ? `${Math.abs(viewportPosition.x)}px` : undefined,
                              height: viewportPosition.y < 0 ? `${Math.abs(viewportPosition.y)}px` : undefined
                            }}
                          />
                        </div>
                      )}
                    </Rnd>
                  </div>

                  {/* Color Adjustment Controls */}
                  <div className="w-[800px] bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-4">
                    <div className="flex items-center gap-8">
                      {Object.entries(colorAdjustments).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-4">
                          <span className="text-sm font-medium text-gray-600 min-w-[80px] capitalize">
                            {key}
                          </span>
                          <input
                            type="range"
                            min={MIN_COLOR_VALUE}
                            max={MAX_COLOR_VALUE}
                            value={value}
                            onChange={(e) => {
                              setColorAdjustments(prev => ({
                                ...prev,
                                [key]: Number(e.target.value)
                              }));
                            }}
                            className="w-32 h-1.5 bg-gradient-to-r from-blue-200 to-blue-400 rounded-full 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}

                      {/* Auto Adjust Button */}
                      <div className="relative group ml-auto">
                        <button
                          onClick={autoAdjustColors}
                          className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center
                                   hover:bg-blue-600 transition-all duration-200 
                                   shadow-sm hover:shadow-md"
                          aria-label="Auto adjust"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-2.5 w-2.5 text-white" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" 
                              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                        </button>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 
                                     bg-gray-800/90 text-white text-xs rounded whitespace-nowrap
                                     opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                     pointer-events-none">
                          Auto
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Effects View */}
              <div className="min-w-full">
                {/* Add effects implementation */}
              </div>
            </div>
          </div>

          {/* Status and Download Section */}
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex justify-center gap-4">
            {loading ? (
              <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-lg shadow flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <span>Processing your image...</span>
              </div>
            ) : downloadReady && (
              <div className="flex gap-4">
                <button
                  onClick={downloadComposedImage}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg
                             hover:from-blue-600 hover:to-blue-700 transition-all duration-200
                             shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Download Image
                </button>
                <button
                  onClick={() => {
                    setIsReset(true);
                    setColorAdjustments({
                      brightness: 100,
                      contrast: 100,
                      saturation: 100,
                    });
                    setSelectedBackground('/templates/white-bg.jpg');
                    setViewportPosition(centerPosition);
                    setResizedImageDimensions({
                      width: originalImageDimensions.width,
                      height: originalImageDimensions.height
                    });
                  }}
                  className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-200 
                             transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Reset Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


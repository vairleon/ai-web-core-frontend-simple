'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/utils/api';
import { Task } from '@/types/api';
import Header from '@/components/portrait/Header';
import Footer from '@/components/portrait/Footer';
import { CompareSlider } from '@/components/imageutils/CompareSlider';
import { Tooltip } from '@/components/imageutils/Tooltip';
import SquigglyLines from '@/components/portrait/SquigglyLines';
import Head from 'next/head';
import { Rnd } from 'react-rnd';
import Feedback from '@/components/portrait/Feedback';
import { useLanguage } from '@/contexts/LanguageContext';

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
const TEMPLATE_GAP = 20;
const SLIDER_ITEM_OFFSET = TEMPLATE_ITEM_WIDTH + TEMPLATE_GAP;
const IMAGE_SIZES = "(max-width: 800px) 100vw, 800px";
const THUMBNAIL_SIZES = "(max-width: 80px) 100vw, 80px";
const TEMPLATE_NAME = 'portrait';
const SLIDER_CONTAINER_WIDTH = 580;
const ARROW_BUTTON_SIZE = 24;
const STROKE_WIDTH = 2;
const HEADING_MARGIN = 4;
const TEMPLATE_CONTAINER_MARGIN = 8;
const HOVER_SCALE = 1.5;
const HOVER_TRANSITION_DURATION = 300;

interface TemplateDataSchema {
  imageUrl: string;
  text: string;
}

interface TemplateResultSchema {
  imageUrl: string;
}

// const TemplateId:string = '0';
const TemplateName:string = 'portrait';

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

// Portrait templates
const PORTRAIT_TEMPLATES = [
  '/Portrait/p1.jpeg',
  '/Portrait/p2.jpeg',
  '/Portrait/p3.jpeg',
  '/Portrait/p4.jpg',
  '/Portrait/p5.jpeg',
  '/Portrait/p6.jpeg',
];

// 添加模板描述的映射
const PORTRAIT_TEMPLATES_MAP = {
  '/Portrait/p1.jpeg': '证件照 - 标准白底',
  '/Portrait/p2.jpeg': '证件照 - 蓝底商务',
  '/Portrait/p3.jpeg': '艺术写真 - 暖色调',
  '/Portrait/p4.jpg': '毕业照 - 学术风格',
  '/Portrait/p5.jpeg': '职业照 - 专业商务',
  '/Portrait/p6.jpeg': '生活照 - 自然风格',
} as const;

// 添加新的样式常量
const TEMPLATE_CONTAINER_STYLES = {
  width: CONTAINER_WIDTH,
  padding: '20px',
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  overflow: 'visible'
  // width: CONTAINER_WIDTH,
  // overflowX: 'hidden' as const,  // 只在水平方向隐藏溢出
  // overflowY: 'visible' as const, // 垂直方向允许溢出
  // position: 'relative' as const,
};

// 修改模板按钮样式
const TEMPLATE_BUTTON_STYLES = `
  relative 
  shrink-0 
  w-20
  h-20
  rounded-lg 
  overflow-visible
  border-2 
  transition-all
  duration-${HOVER_TRANSITION_DURATION}
  ease-out
  hover:scale-${HOVER_SCALE * 20}
  hover:z-10
  focus:outline-none
  group
`;

// 修改描述框样式
const DESCRIPTION_STYLES = `
  absolute
  -top-10
  left-1/2
  -translate-x-1/2
  bg-black
  bg-opacity-75
  text-white
  px-3
  py-1
  rounded-full
  text-sm
  whitespace-nowrap
  opacity-0
  transition-opacity
  duration-300
  pointer-events-none
  group-hover:opacity-100
  z-20
  rounded-lg
  shadow-lg
`;


// 添加滑动容器样式
const SLIDER_WRAPPER_STYLES = {
  width: SLIDER_CONTAINER_WIDTH,
  overflowX: 'hidden' as const,  // 只在水平方向隐藏溢出
  overflowY: 'visible' as const, // 垂直方向允许溢出
  position: 'relative' as const,
  padding: '40px 0',
  // marginTop: '20px'  // 为顶部描述文字留出空间
};

export default function GeneratePortraitAction() {
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
            imageUrl: uploadResult.url,
            text: 'default'
          };

          const newTask = await api.createTask({
            name: 'Generate Portrait',
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
              
              // 更新状，但保持原始 resultUrl 不变
              setResultUrl(imageUrl); // 原始图片用于 Compare 视图
              setCroppedResultUrl(croppedUrl); // 新增状态用 Background 和 Color 视图
              
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

  // 在组件中添加描述显示状态
  const [activeDescription, setActiveDescription] = useState<string>('');

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

  // 在件顶部添加新的状态
  const [croppedResultUrl, setCroppedResultUrl] = useState<string>(resultUrl);

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

  // 在组件内添加状态
  const [selectedTemplate, setSelectedTemplate] = useState(PORTRAIT_TEMPLATES[0]);

  //
  return (
    <div className='flex max-w-6xl mx-auto flex-col items-center justify-center py-2 min-h-screen'>
      <Head>
        <title>Portrait</title>
      </Head>
      <Header />
      <main className='flex flex-1 py-5 w-full flex-col items-center justify-center text-center px-4 mt-12'>
        {/* Title Section */}
        <h1 className='mx-auto max-w-4xl font-display text-5xl font-bold tracking-normal text-slate-900 sm:text-7xl mb-8'>
          Auto create portrait{' '}
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
            Generate Portrait
          </button>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileAndUpload}
            disabled={loading}
          />
        </div>
         {/*  Templates Slider */}
         <div className="relative w-full max-w-16xl min-h-[600px]">
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
            </div>
          </div>
        </div>

        {/* Portrait Templates Slider - Moved below the main content */}
        <div className="w-full relative" style={TEMPLATE_CONTAINER_STYLES}>
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
            Select Portrait Style
          </h3>
          
          {/* 固定的当前选择描述区域 */}
          <div className="text-center mb-6 h-4 text-gray-700 font-medium transition-all duration-300">
            {PORTRAIT_TEMPLATES_MAP[selectedTemplate as keyof typeof PORTRAIT_TEMPLATES_MAP] || '请选择一个模板风格'}
          </div>

          <div className="flex items-center justify-center">
            {/* Left arrow - 确保始终显示 */}
            <button
              onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
              disabled={currentIndex === 0}
              className={`p-2 rounded-full transition-colors z-10 ${
                currentIndex === 0 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width={ARROW_BUTTON_SIZE} 
                height={ARROW_BUTTON_SIZE} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Templates Container with mask */}
            <div style={SLIDER_WRAPPER_STYLES}>
              <div 
                className="flex gap-4 transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * SLIDER_ITEM_OFFSET}px)` }}
              >
                {PORTRAIT_TEMPLATES.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedTemplate(template)}
                    className={`${TEMPLATE_BUTTON_STYLES} ${
                      selectedTemplate === template 
                        ? 'border-blue-500 ring-2 ring-blue-500' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="relative w-full h-full">
                      {/* 描述文字 */}
                      <div 
                        className={`
                          ${DESCRIPTION_STYLES}
                          ${selectedTemplate === template || 'group-hover:opacity-100 opacity-0'}
                        `}
                      >
                        {PORTRAIT_TEMPLATES_MAP[template as keyof typeof PORTRAIT_TEMPLATES_MAP]}
                      </div>

                      {/* 选中状态指示器 */}
                      {selectedTemplate === template && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 z-10 transition-transform duration-300 group-hover:scale-125">
                          <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      <Image 
                        src={template} 
                        alt={PORTRAIT_TEMPLATES_MAP[template as keyof typeof PORTRAIT_TEMPLATES_MAP]}
                        fill
                        sizes={THUMBNAIL_SIZES}
                        className={`
                          object-cover 
                          transition-transform 
                          duration-300 
                          group-hover:scale-125
                          shadow-xl
                          rounded-lg
                          ${selectedTemplate === template ? 'ring-2 ring-blue-500' : ''}
                        `}
                        priority={index < VISIBLE_ITEMS}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right arrow */}
            <button
              onClick={() => setCurrentIndex(prev => Math.min(prev + 1, PORTRAIT_TEMPLATES.length - VISIBLE_ITEMS))}
              disabled={currentIndex >= PORTRAIT_TEMPLATES.length - VISIBLE_ITEMS}
              className={`p-2 rounded-full transition-colors z-10 ${
                currentIndex >= PORTRAIT_TEMPLATES.length - VISIBLE_ITEMS
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width={ARROW_BUTTON_SIZE} 
                height={ARROW_BUTTON_SIZE} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 指示器栏 */}
          <div className="flex justify-center gap-2 mt-4">
            {PORTRAIT_TEMPLATES.map((_, index) => (
              <div
                key={index}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${index === PORTRAIT_TEMPLATES.indexOf(selectedTemplate)
                    ? 'bg-blue-500 w-4'
                    : 'bg-gray-300'
                  }
                `}
              />
            ))}
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
      </main>
      <Footer />
    </div>
  );
}


import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DraggableTopHeaderProps {
  children: React.ReactNode;
  initialCollapsed?: boolean;
  bgClassName?: string;
  lineMarginClass?: string;
}

export const DraggableTopHeader: React.FC<DraggableTopHeaderProps> = ({
  children,
  initialCollapsed = false,
  bgClassName = 'bg-[#0a0702]',
  lineMarginClass = 'my-2',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isDragging, setIsDragging] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  const startYRef = useRef<number>(0);
  const initialHeightRef = useRef<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle touch start on the white line
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    initialHeightRef.current = contentRef.current ? contentRef.current.offsetHeight : 0;
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;
    const maxAllowed = Math.max(600, (contentRef.current ? contentRef.current.scrollHeight : 400));
    const newHeight = Math.max(0, Math.min(maxAllowed, initialHeightRef.current + deltaY));
    setDragHeight(newHeight);
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragHeight !== null) {
      if (dragHeight < 30) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
      setDragHeight(null);
    }
  };

  // Handle mouse start
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    initialHeightRef.current = contentRef.current ? contentRef.current.offsetHeight : 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startYRef.current;
      const maxAllowed = Math.max(600, (contentRef.current ? contentRef.current.scrollHeight : 400));
      const newHeight = Math.max(0, Math.min(maxAllowed, initialHeightRef.current + deltaY));
      setDragHeight(newHeight);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      const deltaY = upEvent.clientY - startYRef.current;
      const finalH = Math.max(0, initialHeightRef.current + deltaY);
      if (finalH < 30) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
      setDragHeight(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Toggle on click/tap if not dragged
  const handleLineClick = () => {
    if (!isDragging) {
      setIsCollapsed((prev) => !prev);
    }
  };

  // Calculated styles
  const isContentHidden = isCollapsed && dragHeight === null;

  return (
    <div className="w-full shrink-0 select-none z-20 flex flex-col">
      {/* 1. Header Content Container (Dark background + Game Name + All Buttons) */}
      <div
        ref={contentRef}
        style={
          dragHeight !== null
            ? { height: `${dragHeight}px`, overflow: 'hidden' }
            : isContentHidden
            ? { height: '0px', opacity: 0, overflow: 'hidden' }
            : { height: 'auto', opacity: 1 }
        }
        className={`w-full ${bgClassName} transition-[height,opacity] ${
          isDragging ? 'duration-0' : 'duration-300'
        } overflow-hidden`}
      >
        <div className="w-full">{children}</div>
      </div>

      {/* 2. The Interactive Draggable / Movable White Line (الخط الأبيض التفاعلي) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={handleLineClick}
        title={
          isCollapsed
            ? 'اسحب أو اضغط لإظهار اسم اللعبة وجميع الكبسات ⬇️'
            : 'اسحب أو اضغط للأعلى لإخفاء الشاشة والكبسات ⬆️'
        }
        className={`w-full px-3 sm:px-6 cursor-row-resize active:cursor-grabbing py-1.5 flex flex-col items-center group transition-transform ${lineMarginClass}`}
      >
        {/* The glowing prominent white line */}
        <div className="relative w-full h-1.5 sm:h-2 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.95)] group-hover:shadow-[0_0_30px_rgba(255,255,255,1)] group-hover:scale-[1.005] transition-all flex items-center justify-center">
          {/* Subtle central grip indicator */}
          <div className="absolute px-3 py-0.5 rounded-full bg-black/90 border border-white/80 shadow-[0_0_10px_rgba(255,255,255,0.8)] text-white text-[10px] font-black flex items-center gap-1">
            {isCollapsed ? (
              <>
                <span>اسحب للأسفل لإظهار الكبسات</span>
                <ChevronDown className="w-3 h-3 text-white animate-bounce" />
              </>
            ) : (
              <>
                <span>اسحب للأعلى لإخفاء الكبسات</span>
                <ChevronUp className="w-3 h-3 text-white animate-bounce" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

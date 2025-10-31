import React, { useRef, useEffect, useState, useCallback } from 'react';
import './PixelCanvas.css';

const PixelCanvas = ({
  gridWidth,
  gridHeight,
  pixels,
  onSelectionChange,
  selectedPixels,
  onPixelClick
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Pan and zoom state - start zoomed in so pixels are visible
  const [scale, setScale] = useState(3);
  const [offset, setOffset] = useState({ x: 50, y: 50 });

  // Interaction state
  const [isPanning, setIsPanning] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [hoveredPixel, setHoveredPixel] = useState(null);

  // Convert screen coordinates to grid coordinates
  const screenToGrid = useCallback((screenX, screenY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = (screenX - rect.left - offset.x) / scale;
    const y = (screenY - rect.top - offset.y) / scale;

    const gridX = Math.floor(x);
    const gridY = Math.floor(y);

    if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
      return { x: gridX, y: gridY };
    }
    return null;
  }, [offset, scale, gridWidth, gridHeight]);

  // Calculate selection rectangle
  const getSelectionRect = useCallback(() => {
    if (!selectionStart || !selectionEnd) return null;

    const x1 = Math.min(selectionStart.x, selectionEnd.x);
    const y1 = Math.min(selectionStart.y, selectionEnd.y);
    const x2 = Math.max(selectionStart.x, selectionEnd.x);
    const y2 = Math.max(selectionStart.y, selectionEnd.y);

    return { x1, y1, x2, y2 };
  }, [selectionStart, selectionEnd]);

  // Get all pixels in selection
  const getSelectedPixels = useCallback(() => {
    const rect = getSelectionRect();
    if (!rect) return [];

    const selected = [];
    for (let y = rect.y1; y <= rect.y2; y++) {
      for (let x = rect.x1; x <= rect.x2; x++) {
        selected.push({ x, y });
      }
    }
    return selected;
  }, [getSelectionRect]);

  // Draw the canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Create pixel map for faster lookup
    const pixelMap = new Map();
    pixels.forEach(p => {
      pixelMap.set(`${p.x},${p.y}`, p);
    });

    // Draw grid and pixels
    const pixelSize = 1;

    // Only draw visible pixels for performance
    const visibleStartX = Math.max(0, Math.floor(-offset.x / scale));
    const visibleStartY = Math.max(0, Math.floor(-offset.y / scale));
    const visibleEndX = Math.min(gridWidth, Math.ceil((width - offset.x) / scale));
    const visibleEndY = Math.min(gridHeight, Math.ceil((height - offset.y) / scale));

    for (let y = visibleStartY; y < visibleEndY; y++) {
      for (let x = visibleStartX; x < visibleEndX; x++) {
        const pixel = pixelMap.get(`${x},${y}`);

        if (pixel) {
          ctx.fillStyle = pixel.color || '#ffffff';
        } else {
          // Available pixels - light gray so they're visible
          ctx.fillStyle = '#666666';
        }

        ctx.fillRect(x, y, pixelSize, pixelSize);
      }
    }

    // Draw grid lines when zoomed in enough
    if (scale > 4) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 0.05;

      for (let x = visibleStartX; x <= visibleEndX; x++) {
        ctx.beginPath();
        ctx.moveTo(x, visibleStartY);
        ctx.lineTo(x, visibleEndY);
        ctx.stroke();
      }

      for (let y = visibleStartY; y <= visibleEndY; y++) {
        ctx.beginPath();
        ctx.moveTo(visibleStartX, y);
        ctx.lineTo(visibleEndX, y);
        ctx.stroke();
      }
    }

    // Draw selection
    const currentSelection = selectedPixels || getSelectedPixels();
    if (currentSelection.length > 0) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.lineWidth = 0.1;

      currentSelection.forEach(({ x, y }) => {
        ctx.fillRect(x, y, pixelSize, pixelSize);
        ctx.strokeRect(x, y, pixelSize, pixelSize);
      });
    }

    // Draw hovered pixel
    if (hoveredPixel && scale > 2) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.15;
      ctx.strokeRect(hoveredPixel.x, hoveredPixel.y, pixelSize, pixelSize);
    }

    ctx.restore();
  }, [pixels, offset, scale, gridWidth, gridHeight, selectedPixels, getSelectedPixels, hoveredPixel]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      // Don't auto-center, let the initial offset handle it

      draw();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw, scale, offset, gridWidth, gridHeight]);

  // Redraw when state changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse/touch handlers
  const handlePointerDown = (e) => {
    const pos = { x: e.clientX, y: e.clientY };
    setLastPos(pos);

    if (e.shiftKey || e.touches?.length === 2) {
      // Pan mode
      setIsPanning(true);
    } else {
      // Selection mode
      const gridPos = screenToGrid(e.clientX, e.clientY);
      if (gridPos) {
        setIsSelecting(true);
        setSelectionStart(gridPos);
        setSelectionEnd(gridPos);
      }
    }
  };

  const handlePointerMove = (e) => {
    const pos = { x: e.clientX, y: e.clientY };

    if (isPanning) {
      const dx = pos.x - lastPos.x;
      const dy = pos.y - lastPos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPos(pos);
    } else if (isSelecting) {
      const gridPos = screenToGrid(e.clientX, e.clientY);
      if (gridPos) {
        setSelectionEnd(gridPos);
      }
    } else {
      // Update hovered pixel
      const gridPos = screenToGrid(e.clientX, e.clientY);
      setHoveredPixel(gridPos);
    }
  };

  const handlePointerUp = () => {
    if (isSelecting && selectionStart && selectionEnd) {
      const selected = getSelectedPixels();
      if (onSelectionChange) {
        onSelectionChange(selected);
      }
      if (selected.length === 1 && onPixelClick) {
        const pixel = pixels.find(p => p.x === selected[0].x && p.y === selected[0].y);
        onPixelClick(pixel);
      }
    }

    setIsPanning(false);
    setIsSelecting(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(0.5, scale * delta), 50);

    // Zoom towards mouse position
    const factor = newScale / scale;
    setOffset({
      x: mouseX - (mouseX - offset.x) * factor,
      y: mouseY - (mouseY - offset.y) * factor,
    });
    setScale(newScale);
  };

  // Touch gestures
  const lastTouchDistance = useRef(null);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      lastTouchDistance.current = distance;
      setIsPanning(true);
    } else if (e.touches.length === 1) {
      handlePointerDown({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
      });
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();

    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (lastTouchDistance.current) {
        const delta = distance / lastTouchDistance.current;
        const newScale = Math.min(Math.max(0.5, scale * delta), 50);

        // Zoom towards center of two touches
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const canvasCenterX = centerX - rect.left;
        const canvasCenterY = centerY - rect.top;

        const factor = newScale / scale;
        setOffset({
          x: canvasCenterX - (canvasCenterX - offset.x) * factor,
          y: canvasCenterY - (canvasCenterY - offset.y) * factor,
        });
        setScale(newScale);
      }

      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1) {
      handlePointerMove({
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
      });
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
    handlePointerUp();
  };

  // Get pixel at hover position
  const getHoveredPixelData = () => {
    if (!hoveredPixel) return null;
    return pixels.find(p => p.x === hoveredPixel.x && p.y === hoveredPixel.y);
  };

  const hoveredPixelData = getHoveredPixelData();

  return (
    <div className="pixel-canvas-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="pixel-canvas"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Zoom controls */}
      <div className="zoom-controls">
        <button onClick={() => setScale(s => Math.min(s * 1.5, 50))}>+</button>
        <span>{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.max(s / 1.5, 0.5))}>-</button>
        <button onClick={() => {
          setScale(3);
          setOffset({ x: 50, y: 50 });
        }}>Reset</button>
      </div>

      {/* Pixel info tooltip */}
      {hoveredPixelData && scale > 2 && (
        <div className="pixel-tooltip">
          <strong>{hoveredPixelData.username}</strong>
          <div>({hoveredPixelData.x}, {hoveredPixelData.y})</div>
          {hoveredPixelData.tooltip && <div>{hoveredPixelData.tooltip}</div>}
          {hoveredPixelData.linkUrl && (
            <a href={hoveredPixelData.linkUrl} target="_blank" rel="noopener noreferrer">
              Visit Link
            </a>
          )}
        </div>
      )}

      {/* Selection info */}
      {(selectedPixels?.length > 0 || getSelectedPixels().length > 0) && (
        <div className="selection-info">
          {(selectedPixels?.length || getSelectedPixels().length)} pixels selected
          (${selectedPixels?.length || getSelectedPixels().length})
        </div>
      )}

      {/* Instructions */}
      <div className="canvas-instructions">
        <div>💡 Shift+Drag or Two-finger drag to pan</div>
        <div>🔍 Scroll or pinch to zoom</div>
        <div>🖱️ Click and drag to select pixels</div>
      </div>
    </div>
  );
};

export default PixelCanvas;

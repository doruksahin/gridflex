import useMousePosition from '@/src/hooks/useMousePosition';
import { useEffect, useState } from 'react';

interface DraggingRect {
  x: number;
  y: number;
  width: number;
  height: number;
  lastMouseX: number;
  lastMouseY: number;
  mouseLeft: number;
  mouseTop: number;
}

interface MousePosition {
  x: number | null;
  y: number | null;
}

export default function useDraggingPosition() {
  const mousePosition: MousePosition = useMousePosition();
  const [draggingRect, setDraggingRect] = useState<
    DraggingRect | Record<string, never>
  >({});

  function onDraggingStart(
    event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>
  ) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const { x, y, width, height } = rect;
    const clientX =
      'touches' in event && event.touches.length > 0
        ? event.touches[0].clientX
        : (event as React.MouseEvent).clientX;
    const clientY =
      'touches' in event && event.touches.length > 0
        ? event.touches[0].clientY
        : (event as React.MouseEvent).clientY;

    setDraggingRect({
      x,
      y,
      width,
      height,
      lastMouseX: clientX,
      lastMouseY: clientY,
      mouseLeft: x - clientX,
      mouseTop: y - clientY,
    });
  }

  useEffect(() => {
    if (
      (draggingRect as DraggingRect).x == null ||
      mousePosition.x == null ||
      mousePosition.y == null
    )
      return;
    const { x: mouseX, y: mouseY } = mousePosition;
    setDraggingRect((prev) => {
      const prevRect = prev as DraggingRect;
      return {
        ...prevRect,
        x: prevRect.x - (prevRect.lastMouseX - mouseX),
        y: prevRect.y - (prevRect.lastMouseY - mouseY),
        lastMouseX: mouseX,
        lastMouseY: mouseY,
      };
    });
  }, [mousePosition]);

  function onDraggingStop(
    event?: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>
  ) {
    setDraggingRect({});
  }

  return { draggingRect, onDraggingStart, onDraggingStop };
}

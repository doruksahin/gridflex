import React, {ReactNode, cloneElement, useEffect, useState} from 'react';
import usePrevious from '@/src/hooks/usePrevious';
import useDraggingPosition from '@/src/hooks/useDraggingPosition';

type Square = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  index: number;
};

type Point = {
  x: number;
  y: number;
};

type MergedCell = {
  xLength: number;
  yLength: number;
  indices: number[];
  [key: string]: any;
};

type GridProps = {
  length: number;
  children: ReactNode;
  isEditing: boolean;
  initialData: MergedCell[];
  setData: (arg0: any) => void;
};

export default function Grid({
  length = 10,
  children,
  isEditing = false,
  initialData = [],
  setData,
}: GridProps) {
  const [isDragging, setIsDragging] = useState<boolean | null>(null);
  const previousIsDragging = usePrevious(isDragging);
  const isDraggingStopped = previousIsDragging == true && isDragging == false;
  const {
    draggingRect,
    onDraggingStart: draggingMergedStarted,
    onDraggingStop,
  } = useDraggingPosition();

  const [squareIndexesList, setSquareIndexesList] = useState(initialData);
  const squareIndexesToBeSkipped = squareIndexesList
    .map(squareIndexes => squareIndexes.indices.slice(0))
    .flat()
    .sort((a, b) => a - b);
  const [completedSquarePreview, setCompletedSquarePreview] = useState<any>({
    xLength: 0,
    yLength: 0,
    indices: [],
  });
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [draggingMergedItem, setDraggingMergedItem] = useState(null);
  const [isDraggingMergedOne, setIsDraggingMergedOne] = useState(false);

  const draggingStarted = (index: number) => {
    if (!isEditing) return;
    setIsDragging(true);
    setDragStartIndex(index);
    setCurrentIndex(index);
  };

  const handleMouseEnter = (index: number) => {
    if (!isDragging || !isEditing) return;
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (setData) {
      setData(squareIndexesList);
    }
  }, [squareIndexesList]);

  useEffect(() => {
    if (dragStartIndex == null || currentIndex == null) return;
    const square = completeSquare(currentIndex);
    setCompletedSquarePreview(square);
  }, [dragStartIndex, currentIndex]);

  useEffect(() => {
    if (!isDraggingStopped) return;
    setDragStartIndex(null);
    setCurrentIndex(null);
    if (completedSquarePreview.indices.length != 0) {
      setSquareIndexesList(prev => [...prev, completedSquarePreview]);
      setCompletedSquarePreview({x: 0, y: 0, indices: []});
    }
  }, [isDraggingStopped, completedSquarePreview]);

  function completeSquare(lastIndex: number) {
    const startX = dragStartIndex % length;
    const endX = lastIndex % length;
    const [lowX, highX] = startX > endX ? [endX, startX] : [startX, endX];
    const xs = [];
    for (let i = lowX; i <= highX; i++) {
      xs.push(i);
    }

    const startY = Math.floor(dragStartIndex / length);
    const endY = Math.floor(lastIndex / length);
    const [lowY, highY] = startY > endY ? [endY, startY] : [startY, endY];
    const ys = [];
    for (let i = lowY; i <= highY; i++) {
      ys.push(i);
    }

    const candidateSquareIndices = [];
    for (const x of xs) {
      for (const y of ys) {
        candidateSquareIndices.push(x + y * length);
      }
    }
    if (
      candidateSquareIndices.some(gridIndex =>
        squareIndexesList
          .map(squareIndexes => squareIndexes.indices)
          .flat()
          .includes(gridIndex),
      )
    )
      candidateSquareIndices.length = 0;
    return {
      xLength: xs.length,
      yLength: ys.length,
      indices: candidateSquareIndices,
    };
  }

  function isCandidateValid(candidateSquareIndices) {
    return candidateSquareIndices.some(gridIndex =>
      squareIndexesList
        .map(squareIndexes => squareIndexes.indices)
        .flat()
        .includes(gridIndex),
    );
  }

  function mobileHandleTouchEnter(event) {
    const touch = event.touches[0];
    const gridItem = document.elementFromPoint(touch.clientX, touch.clientY);
    if (gridItem?.dataset?.index) {
      handleMouseEnter(gridItem.dataset.index);
    } else {
      setIsDragging(false);
    }
  }

  function undoMerge(index) {
    setSquareIndexesList(
      squareIndexesList.filter(square => square.indices[0] !== index),
    );
  }

  function onDraggingMergedStarted(index, event) {
    if (event.target.innerHTML == 'X' || isEditing == false) return;
    setIsDraggingMergedOne(true);
    const droppedItem = squareIndexesList.find(
      square => square.indices[0] === index,
    );
    setDraggingMergedItem(droppedItem);

    setSquareIndexesList(
      squareIndexesList.filter(square => square.indices[0] !== index),
    );
    draggingMergedStarted(event);
  }
  function draggingStopped(event) {
    if (isDragging == true) {
      setIsDragging(false);
    } else if (isDraggingMergedOne == true) {
      const gridCellIndex =
        event.target.getAttribute('data-index') != null
          ? event.target.getAttribute('data-index')
          : event.target.parentElement.parentElement.getAttribute('data-index');
      onDraggingStop(event);

      const xFloorDiff = Math.floor(
        -draggingRect.mouseLeft / event.target.clientWidth,
      );
      const yFloorDiff = Math.floor(
        -draggingRect.mouseTop / event.target.clientHeight,
      );
      const offset = xFloorDiff + length * yFloorDiff;
      //console.log({xFloorDiff, yFloorDiff, gridCellIndex});

      const diff = gridCellIndex - draggingMergedItem.indices[0] - offset;
      const newDraggingMergedItem = {...draggingMergedItem};
      newDraggingMergedItem.indices = draggingMergedItem.indices.map(
        index => index + diff,
      );

      if (isNewIndicesValid(newDraggingMergedItem)) {
        setSquareIndexesList(prev => [...prev, newDraggingMergedItem]);
      } else {
        setSquareIndexesList(prev => [...prev, draggingMergedItem]);
      }
      setIsDraggingMergedOne(false);
    }
  }

  function isNewIndicesValid(newDraggingMergedItem) {
    const newY =
      (newDraggingMergedItem.indices[0] + newDraggingMergedItem.xLength) /
      length;
    const isOutOfBoundsX =
      Math.floor(newDraggingMergedItem.indices[0] / length) !=
        Math.floor(newY) && Math.floor(newY) != newY;

    const isOutOfBoundsY =
      Math.floor(newDraggingMergedItem.indices[0] / length) +
        newDraggingMergedItem.yLength >
        length || Math.floor(newDraggingMergedItem.indices[0] / length) < 0;

    return (
      !newDraggingMergedItem.indices.some(gridIndex =>
        squareIndexesList
          .map(squareIndexes => squareIndexes.indices)
          .flat()
          .includes(gridIndex),
      ) &&
      !isOutOfBoundsX &&
      !isOutOfBoundsY
    );
  }

  function gridDraggingStarted(event) {}

  return (
    <div className="w-full h-full">
      <Dragged draggingRect={draggingRect} />
      <div
        className="grid h-full"
        onMouseUp={event => draggingStopped(event)}
        onMouseLeave={event => draggingStopped(event)}
        onTouchEnd={event => draggingStopped(event)}
        onMouseDown={event => gridDraggingStarted(event)}
        onTouchStart={event => gridDraggingStarted(event)}
        style={{
          gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${length}, minmax(0, 1fr))`,
          gridAutoRows: 'minmax(0, 1fr)',
          gridAutoColumns: 'minmax(0, 1fr)',
        }}>
        {new Array(length * length).fill(null).map((square, index) => {
          const filteredSquareProperties = squareIndexesList.filter(
            squareProperty => squareProperty.indices[0] == index,
          );
          const squareProperty =
            filteredSquareProperties.length > 0
              ? filteredSquareProperties[0]
              : null;
          const shouldSkip = squareIndexesToBeSkipped.includes(index);
          if (squareProperty) {
            return (
              <div
                data-index={index}
                onMouseDown={event => onDraggingMergedStarted(index, event)}
                onTouchStart={event => onDraggingMergedStarted(index, event)}
                onTouchMove={event => {
                  mobileHandleTouchEnter(event);
                }}
                onMouseEnter={() => handleMouseEnter(index)}
                key={index}
                className={`${
                  isEditing ? 'border border-black' : ''
                } relative flex items-center justify-center bg-slate-200`}
                style={{
                  gridRow: `span ${squareProperty.yLength}`,
                  gridColumn: `span ${squareProperty.xLength}`,
                }}>
                <div className="flex h-full w-full flex-col">
                  {children ? (
                    cloneElement(children, {
                      index: index,
                      onUndoMerge: event => {
                        undoMerge(index);
                      },
                    })
                  ) : (
                    <div className="w-full h-full relative">
                      <div
                        className="w-fit bg-blue-400 px-4 py-2 cursor-pointer"
                        onClick={() => undoMerge(index)}>
                        X
                      </div>
                      <div className="absolute top-1/2 left-1/2  text-3xl"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          } else if (shouldSkip) {
            return <></>;
          } else {
            return (
              <div
                data-index={index}
                onMouseDown={() => draggingStarted(index)}
                onTouchStart={() => draggingStarted(index)}
                onTouchMove={event => {
                  mobileHandleTouchEnter(event);
                }}
                onMouseEnter={() => handleMouseEnter(index)}
                key={index}
                className={`${
                  isEditing ? 'cursor-grab border border-black' : ''
                } flex select-none items-center justify-center ${
                  completedSquarePreview.indices.includes(index)
                    ? 'bg-red-200'
                    : ''
                }`}></div>
            );
          }
        })}

        {/* Add more grid cells as needed */}
      </div>
    </div>
  );
}

function Dragged({draggingRect}) {
  if (draggingRect.x == null) return <></>;
  return (
    <div
      className="absolute bg-red-300 pointer-events-none -z-20"
      style={{
        top: draggingRect.y,
        left: draggingRect.x,
        width: draggingRect.width,
        height: draggingRect.height,
      }}
    />
  );
}

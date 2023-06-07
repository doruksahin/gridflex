import React from 'react';

export interface GridProps {
  label: string;
}

const Grid = (props: GridProps) => {
  return <div className="bg-red-300">This is a Grid</div>;
};

export default Grid;

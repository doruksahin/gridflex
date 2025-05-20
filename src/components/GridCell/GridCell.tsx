import React, { ChangeEvent, useEffect, useState } from 'react';

export default function GridCell({
  isEditing,
  data = [],
  setData,
  index,
  onUndoMerge,
}: {
  isEditing: boolean;
  data: Array<{ indices: number[]; yourCustomComponentText?: string }>;
  setData: React.Dispatch<React.SetStateAction<any>>;
  index: number;
  onUndoMerge: () => void;
}) {
  const [text, setText] = useState<string | null>(null);

  const datum = data.find((datum) => datum.indices[0] === index);

  useEffect(() => {
    if (datum && text !== datum.yourCustomComponentText) {
      setText(datum.yourCustomComponentText ?? null);
    }
    // Only run when datum or its text changes
  }, [datum?.yourCustomComponentText, index]);

  useEffect(() => {
    if (text === null) return;
    setData(
      (
        prevData: Array<{ indices: number[]; yourCustomComponentText?: string }>
      ) =>
        prevData.map((square) => {
          if (square.indices.includes(index)) {
            return { ...square, yourCustomComponentText: text };
          }
          return square;
        })
    );
  }, [text, setData, index]);

  function textChanged(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value);
  }

  function removeNote() {
    onUndoMerge();
    setData(data.filter((datum) => datum.indices[0] !== index));
  }

  return (
    <div className="flex grow">
      {isEditing ? (
        <>
          <div
            onClick={() => {
              removeNote();
              onUndoMerge();
            }}
            className="bg-red-500 cursor-pointer"
          >
            X
          </div>
          <MyText text={text} />
        </>
      ) : (
        <MyText text={text} />
      )}
    </div>
  );
}

function MyText({ text }: { text: string | null }) {
  return <div>{text ? text : 'This is a custom grid cell'}</div>;
}

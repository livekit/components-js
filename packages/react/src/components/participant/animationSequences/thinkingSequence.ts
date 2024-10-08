export const generateThinkingSequenceBar = (columns: number): number[][] => {
  const seq = [];
  for (let x = 0; x < columns; x++) {
    seq.push([x]);
  }

  for (let x = columns - 1; x >= 0; x--) {
    seq.push([x]);
  }

  return seq;
};

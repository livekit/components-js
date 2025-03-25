export const generateConnectingSequenceBar = (columns: number): number[][] => {
  const seq = [];

  for (let x = 0; x < columns; x++) {
    seq.push([x, columns - 1 - x]);
  }

  return seq;
};

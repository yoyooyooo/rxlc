export type Node = {
  id: string;
  handler?: (input: any[]) => any;
};
export type Edge = { targetNodeId: string; sourceNodeId: string };

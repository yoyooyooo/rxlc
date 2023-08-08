export type Node = {
  id: string;
  handler?: (input: any[]) => any;
  type?: "combine" | "merge"; // 默认 combine
};
export type Edge = { targetNodeId: string; sourceNodeId: string };

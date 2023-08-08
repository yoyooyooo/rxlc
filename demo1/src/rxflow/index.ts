import { delay, map, of } from "rxjs";
import { runFlow } from "./runFlow";
import { Edge, Node } from "./types";

// 初始化节点和边
let nodes: Node[] = [
  { id: "1" },
  {
    id: "2"
  },
  {
    id: "3"
    //   handler: (x) => {
    //     return of(x).pipe(
    //       delay(1000),
    //       map(() => "ppp")
    //     );
    //   }
  },
  {
    id: "4"
    // handler: (x) => {
    //   console.log(444444444444, x);
    //   return "y";
    // }
  },
  {
    id: "5"
    // handler: (x) => {
    //   return of(x).pipe(delay(2000));
    // }
  },
  { id: "6" },
  {
    id: "7"
    // handler: (x) => {
    //   return of(x).pipe(
    //     delay(1000),
    //     map(() => "ppp")
    //   );
    // }
  }
];
let edges: Edge[] = [
  { sourceNodeId: "1", targetNodeId: "2" },
  // { sourceNodeId: "4", targetNodeId: "1" },
  { sourceNodeId: "2", targetNodeId: "3" },
  { sourceNodeId: "2", targetNodeId: "4" },
  { sourceNodeId: "7", targetNodeId: "4" },
  { sourceNodeId: "4", targetNodeId: "5" },
  { sourceNodeId: "4", targetNodeId: "6" }
];

// runFlow({ nodes, edges });

// 检测是否有环
function detectCycle(nodes: Node[], edges: Edge[]) {
  let visited = new Set();
  let recursionStack = new Set();

  function detectCycleDFS(node: Node) {
    visited.add(node);
    recursionStack.add(node);

    let nextNodes = edges
      .filter((edge) => edge.sourceNodeId === node.id)
      .flatMap((edge) => nodes.find((n) => n.id === edge.targetNodeId) || []);

    for (let nextNode of nextNodes) {
      if (!visited.has(nextNode)) {
        if (detectCycleDFS(nextNode)) {
          return true;
        }
      } else if (recursionStack.has(nextNode)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  for (let node of nodes) {
    if (detectCycleDFS(node)) {
      return true;
    }
  }

  return false;
}

console.log(detectCycle(nodes, edges));

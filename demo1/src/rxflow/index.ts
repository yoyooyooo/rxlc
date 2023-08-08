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
  { sourceNodeId: "2", targetNodeId: "3" },
  { sourceNodeId: "2", targetNodeId: "4" },
  { sourceNodeId: "7", targetNodeId: "4" },
  { sourceNodeId: "4", targetNodeId: "5" },
  { sourceNodeId: "4", targetNodeId: "6" }
];

runFlow({ nodes, edges });

import { EMPTY, ReplaySubject, Subscription, catchError, combineLatest, of, tap, map } from "rxjs";
import { transformJsCode } from "./evalJsCode";
import { Edge, Node } from "./types";

let subscriptions = new Subscription();

export const runFlow = ({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
  // 创建一个 Map 来存储每个节点对应的 Subject 和它的订阅状态
  let nodesMap: Map<string, { subject: ReplaySubject<any>; hasSubscribe: boolean; node: Node }> =
    new Map();

  // 对于每一个节点，创建一个对应的 ReplaySubject 和它的初始订阅状态
  nodes.forEach((node) => {
    nodesMap.set(node.id, { node, subject: new ReplaySubject<any>(1), hasSubscribe: false });
  });

  // 找出所有的初始节点
  let startNodes = nodes.filter((node) => !edges.find((edge) => edge.targetNodeId === node.id));

  // 找出所有的末端节点，然后使用 forkJoin 来合并他们的流
  let endNodeSubjects = nodes
    .filter((node) => !edges.find((edge) => edge.sourceNodeId === node.id))
    .map((node) => nodesMap.get(node.id)!.subject);

  // 创建一个堆栈来存储需要处理的节点
  let stack = [...nodes];

  while (stack.length > 0) {
    let node = stack.pop()!;

    // 如果这个节点已经订阅过上游节点，那么跳过它
    if (nodesMap.get(node.id)!.hasSubscribe) continue;

    let upstreamNodesOfMap = edges
      .filter((edge) => edge.targetNodeId === node.id)
      .flatMap((edge) => nodesMap.get(edge.sourceNodeId) || []);

    // 如果这个节点有未订阅的上游节点，那么我们把它放回堆栈，然后继续处理下一个节点
    if (upstreamNodesOfMap.some((node) => !node!.hasSubscribe)) {
      // console.log("放回头部======", node);
      stack.unshift(node); // 放回头部
      continue;
    }

    // 否则，我们订阅这个节点的上游节点
    const subscription = combineLatest(upstreamNodesOfMap.map((a) => a!.subject))
      .pipe(
        map((inputs) => ({ inputs })),
        tap((res) => console.log(`【转换】使用id=${node.id}的handler`, res)),
        transformJsCode(node.handler), // 上游来值，用当前的handler直接处理掉
        tap((res) => {
          nodesMap.get(node.id)!.subject.next(res);
        }),
        // shareReplay(1),
        catchError((err) => {
          console.log(err);
          return EMPTY;
        })
      )
      .subscribe();

    subscriptions.add(subscription);

    nodesMap.get(node.id)!.hasSubscribe = true;
  }

  // 对于源头节点，开始数据流
  nodes.forEach((node) => {
    if (!edges.some((edge) => edge.targetNodeId === node.id)) {
      // console.log(`源头节点`, node.id);
      of({ inputs: ["x"] })
        .pipe(
          tap((res) => console.log(`【转换】{源头}使用id=${node.id}的handler`, res)),
          transformJsCode(node.handler)
        )
        .subscribe((res) => {
          nodesMap.get(node.id)!.subject.next(res);
        });
    }
  });

  combineLatest(endNodeSubjects)
    .pipe(
      catchError((err) => {
        console.log(err);
        return EMPTY;
      })
    )
    .subscribe((res) => {
      console.log("result", res);
    });
};

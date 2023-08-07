import {
  EMPTY,
  ReplaySubject,
  Subscription,
  catchError,
  combineLatest,
  map,
  tap,
  of,
  delay,
  switchMap,
  from,
  isObservable,
  timer,
  take,
  shareReplay
} from "rxjs";
import { evalJsCode, transformJsCode } from "./evalJsCode";

type Node = { id: string; handler?: (input: any[]) => any };
type Edge = { targetNodeId: string; sourceNodeId: string };

let subscriptions = new Subscription();

// 初始化节点和边
let nodes: Node[] = [
  { id: "1" },
  {
    id: "2"
  },
  {
    id: "3",
    handler: (x) => {
      return of(x).pipe(
        delay(1000),
        map(() => "ppp")
      );
    }
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
  const subscription = combineLatest(
    upstreamNodesOfMap.map((a) =>
      a!.subject.pipe(
        tap((res) => {
          // node.id === "4" && console.log("idddd=4", res);
          // console.log(`【转换】${a!.node.id} => ${node.id}，使用id=${node.id}的handler`, res);
        })
      )
    )
  )
    .pipe(
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
    .subscribe((res) => {
      // console.log(`id=${node.id} 得到`, res, { 父级: upstreamNodesOfMap });
      // node.id == "4" && console.log("id=4", { node, upstreamNodesOfMap });
      // nodesMap.get(node.id)!.subject.next(upstreamNodesOfMap.length === 1 ? res[0] : res);
    });

  subscriptions.add(subscription);

  nodesMap.get(node.id)!.hasSubscribe = true;
}

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

// 对于源头节点，开始数据流
nodes.forEach((node) => {
  if (!edges.some((edge) => edge.targetNodeId === node.id)) {
    // console.log(`源头节点`, node.id);
    of(["x"])
      .pipe(
        tap((res) => console.log(`【转换】{源头}使用id=${node.id}的handler`, res)),
        transformJsCode(node.handler)
      )
      .subscribe((res) => {
        nodesMap.get(node.id)!.subject.next(res);
      });
  }
});

// 在需要取消订阅的时候
//subscriptions.unsubscribe();

// timer(0, 1000)
//   .pipe(take(5))
//   .subscribe((res) => {
//     console.log(res);
//   });

import { EMPTY, catchError, delay, from, isObservable, of, switchMap } from "rxjs";
import { evalJsCode } from "./evalJsCode";

type Flow = {
  type: "jsCode";
  code: string;
};

type Node = {
  id: string;
  props: Flow;
};
type Edge = {
  targetNodeId: string;
  sourceNodeId: string;
};

const getOutputNodes = () => {
  return [] as Node[];
};

console.log("start");

const rxjsScope = { switchMap, of, delay };

of([1, 2, 3])
  .pipe(
    switchMap((inputs) => {
      const result = evalJsCode(
        // (arg) => {
        //   const { inputs, r } = arg;
        //   return r.of(inputs).pipe(r.delay(1000));
        // },
        `(arg) => {
            console.log('evalJsCode',{arg})
            const { inputs, r } = arg
            return r.of(inputs).pipe(r.delay(2000));
          }`,
        {
          args: [{ rxjs: rxjsScope, r: rxjsScope, inputs }]
        }
      );
      return from(result).pipe(
        switchMap((input) => {
          if (isObservable(input)) {
            return input;
          } else {
            return of(input);
          }
        })
      );
    }),
    catchError((err) => {
      console.log({ err });
      return EMPTY;
    })
  )
  .subscribe((res) => {
    console.log("输出", { res });
  });

// (async () => {
//   return;
//   const res = await evalJsCode2(`async (arg)=>{
//     console.log({arg})
//     return 12
//   }`);
//   //   const res = await new Function(`
//   //     return 123
//   //     `)();
//   console.log("end", res);
// })();

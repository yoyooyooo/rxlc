import { from, isObservable, of, pipe, switchMap, map, OperatorFunction } from "rxjs";

export const evalJsCode = async (
  code: string | Function,
  options?: {
    args?: any[];
  }
): Promise<any> => {
  const funArgs = options?.args || [];
  try {
    if (typeof code === "function") {
      return await code(...funArgs);
    }
    let asyncFunction = new Function("return (" + code + ")");

    return await asyncFunction()(...funArgs);
  } catch (err) {
    console.log("evalJsCode 执行失败", err);
  }
};

const defaultHandler = (inputs: any[]) => inputs?.[0];

// 处理允许是字符串的函数
export const transformJsCode = (handler?: string | Function): OperatorFunction<any[], any[]> => {
  return pipe(
    !handler
      ? map(defaultHandler) // 默认第一个输入项作为输出
      : switchMap((values) => {
          if (handler) {
            const result = evalJsCode(handler, { args: values });
            return from(result).pipe(
              switchMap((input) => {
                if (isObservable(input)) {
                  return input;
                } else {
                  return of(input);
                }
              })
            );
          }
          return of(values);
        })
  );
};

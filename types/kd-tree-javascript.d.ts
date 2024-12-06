declare module 'kd-tree-javascript' {
    export class kdTree<T> {
      constructor(
        points: T[],
        distance: (a: T, b: T) => number,
        dimensions: Array<keyof T>
      );
  
      nearest(
        point: T,
        maxNodes: number,
        maxDistance?: number
      ): [T, number][];
  
      insert(point: T): void;
  
      remove(point: T): void;
  
      balanceFactor(): number;
    }
  }
  
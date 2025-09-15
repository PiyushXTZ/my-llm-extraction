// apps/api/src/types/pdfjs.d.ts
declare module "pdfjs-dist/legacy/build/pdf" {
  export function getDocument(src: any): { promise: Promise<any> };
  export const GlobalWorkerOptions: any;
  const _default: any;
  export default _default;
}

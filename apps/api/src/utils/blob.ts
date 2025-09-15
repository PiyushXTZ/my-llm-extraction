// // apps/api/src/utils/blob.ts
// import { del } from "@vercel/blob";

// const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// if (!TOKEN) {
//   // don't crash on import — we'll fail at runtime if deletion is attempted without token
//   // console.warn("BLOB_READ_WRITE_TOKEN not set — blob delete will fail");
// }

// export async function deleteBlob(urlOrPathname: string) {
//   if (!TOKEN) {
//     throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
//   }

//   try {
//     // del accepts a single url/path or an array; we pass single here
//     // pass the token in options so SDK can authorize the delete.
//     // The SDK may accept either token or { token }, examples in docs show options param.
//     await del(urlOrPathname, { token: TOKEN });
//     // Note: Vercel may take some time to evict caches; the object may still be served for ~1 minute.
//     return { ok: true };
//   } catch (err: any) {
//     // bubble up useful message
//     throw new Error(err?.message ?? String(err));
//   }
// }

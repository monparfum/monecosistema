// Reduz a foto no navegador antes de subir: até `max` px no lado maior, WebP. Mantém a qualidade visual, corta o peso.
export async function compressImage(file: File, max = 1600, quality = 0.82): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
  // navegador sem WebP no canvas (ou resultado maior): sobe o original
  return blob && blob.type === "image/webp" && blob.size < file.size ? blob : file;
}

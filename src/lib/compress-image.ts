const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export type CompressImageOptions = {
  maxWidth: number;
  maxHeight: number;
  mime: "image/jpeg" | "image/png";
  quality?: number;
};

async function loadSource(file: File) {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
        ctx.drawImage(bitmap, 0, 0, width, height);
      },
      close() {
        bitmap.close();
      },
    };
  }

  const objectUrl = URL.createObjectURL(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Could not read that image."));
    element.src = objectUrl;
  }).catch((error) => {
    URL.revokeObjectURL(objectUrl);
    throw error;
  });

  return {
    width: image.naturalWidth,
    height: image.naturalHeight,
    draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
      ctx.drawImage(image, 0, 0, width, height);
    },
    close() {
      URL.revokeObjectURL(objectUrl);
    },
  };
}

export async function compressImageFile(
  file: File,
  options: CompressImageOptions,
) {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("Use a PNG, JPEG, or WebP image.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Image must be 4 MB or smaller.");
  }

  const source = await loadSource(file);
  const scale = Math.min(
    1,
    options.maxWidth / source.width,
    options.maxHeight / source.height,
  );
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    source.close();
    throw new Error("Could not process that image.");
  }

  if (options.mime === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }

  source.draw(context, width, height);
  source.close();

  const dataUrl = canvas.toDataURL(options.mime, options.quality ?? 0.72);
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("Could not process that image.");
  }

  return dataUrl;
}

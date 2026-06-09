import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase-storage";
import type { AppNode } from "@/types/flow";

const IMAGE_MAX_WIDTH = 520;
const IMAGE_MAX_HEIGHT = 360;
const IMAGE_MIN_WIDTH = 96;
const IMAGE_MIN_HEIGHT = 64;

export type UploadedImageAsset = {
  storagePath: string;
  contentType: string;
  naturalWidth: number;
  naturalHeight: number;
  width: number;
  height: number;
};

export type LocalImageAsset = {
  localAssetId: string;
  objectUrl: string;
  file: File;
  contentType: string;
  naturalWidth: number;
  naturalHeight: number;
  width: number;
  height: number;
};

const localImageAssets = new Map<string, LocalImageAsset>();

function getExtension(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/gif") return "gif";
  if (contentType === "image/webp") return "webp";
  return "image";
}

function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: image.naturalWidth || IMAGE_MIN_WIDTH,
        height: image.naturalHeight || IMAGE_MIN_HEIGHT,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load pasted image."));
    };
    image.src = objectUrl;
  });
}

function getInitialImageSize(naturalWidth: number, naturalHeight: number) {
  const scale = Math.min(
    1,
    IMAGE_MAX_WIDTH / naturalWidth,
    IMAGE_MAX_HEIGHT / naturalHeight,
  );
  const scaledWidth = Math.max(
    IMAGE_MIN_WIDTH,
    Math.round(naturalWidth * scale),
  );
  const scaledHeight = Math.max(
    IMAGE_MIN_HEIGHT,
    Math.round(naturalHeight * scale),
  );

  return { width: scaledWidth, height: scaledHeight };
}

async function uploadImageFile(uid: string, file: File) {
  const { width: naturalWidth, height: naturalHeight } =
    await getImageDimensions(file);
  const contentType = file.type || "image/png";
  const storagePath = `users/${uid}/architecture-images/${crypto.randomUUID()}.${getExtension(contentType)}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType,
    customMetadata: {
      source: "clipboard",
    },
  });

  return {
    storagePath,
    contentType,
    naturalWidth,
    naturalHeight,
    ...getInitialImageSize(naturalWidth, naturalHeight),
  } satisfies UploadedImageAsset;
}

export async function createLocalPastedImage(file: File) {
  const { width: naturalWidth, height: naturalHeight } =
    await getImageDimensions(file);
  const localAssetId = crypto.randomUUID();
  const contentType = file.type || "image/png";
  const localAsset = {
    localAssetId,
    objectUrl: URL.createObjectURL(file),
    file,
    contentType,
    naturalWidth,
    naturalHeight,
    ...getInitialImageSize(naturalWidth, naturalHeight),
  } satisfies LocalImageAsset;

  localImageAssets.set(localAssetId, localAsset);
  return localAsset;
}

export async function persistLocalImageNodes(uid: string, nodes: AppNode[]) {
  const uploads = new Map<string, Promise<UploadedImageAsset>>();

  function getUpload(localAssetId: string) {
    const existing = uploads.get(localAssetId);
    if (existing) return existing;

    const localAsset = localImageAssets.get(localAssetId);
    if (!localAsset) {
      return null;
    }

    const upload = uploadImageFile(uid, localAsset.file);
    uploads.set(localAssetId, upload);
    return upload;
  }

  const nextNodes = await Promise.all(
    nodes.map(async (node) => {
      if (node.type !== "image") {
        return node;
      }

      const data = node.data as {
        localAssetId?: string;
        storagePath?: string;
      };
      if (!data.localAssetId || data.storagePath) {
        return node;
      }

      const upload = getUpload(data.localAssetId);
      if (!upload) {
        return node;
      }

      const uploaded = await upload;
      const restData = { ...(node.data as Record<string, unknown>) };
      delete restData.localAssetId;
      delete restData.objectUrl;

      return {
        ...node,
        data: {
          ...restData,
          storagePath: uploaded.storagePath,
          contentType: uploaded.contentType,
          naturalWidth: uploaded.naturalWidth,
          naturalHeight: uploaded.naturalHeight,
        },
      };
    }),
  );

  return nextNodes;
}

export async function getPastedImageDownloadUrl(storagePath: string) {
  return getDownloadURL(ref(storage, storagePath));
}

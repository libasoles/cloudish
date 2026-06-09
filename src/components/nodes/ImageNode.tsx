import { useEffect, useState } from "react";
import { NodeResizer, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { getPastedImageDownloadUrl } from "@/lib/pasted-images";
import { UI_TEXT, getBrowserLocale } from "@/i18n";

const MIN_IMAGE_NODE_WIDTH = 48;
const MIN_IMAGE_NODE_HEIGHT = 48;

export type ImageNodeData = {
  storagePath?: string;
  localAssetId?: string;
  objectUrl?: string;
  contentType: string;
  alt: string;
  naturalWidth: number;
  naturalHeight: number;
};

export type ImageNodeType = Node<ImageNodeData, "image">;

export default function ImageNode({
  data,
  selected,
}: NodeProps<ImageNodeType>) {
  const [imageState, setImageState] = useState<{
    storagePath: string | null;
    src: string | null;
    failed: boolean;
  }>({
    storagePath: data.storagePath ?? null,
    src: null,
    failed: false,
  });
  const t = UI_TEXT[getBrowserLocale()];

  useEffect(() => {
    const storagePath = data.storagePath;
    if (!storagePath || data.objectUrl) {
      return;
    }

    let cancelled = false;

    getPastedImageDownloadUrl(storagePath)
      .then((downloadUrl) => {
        if (!cancelled) {
          setImageState({
            storagePath,
            src: downloadUrl,
            failed: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setImageState({
            storagePath,
            src: null,
            failed: true,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [data.objectUrl, data.storagePath]);

  const downloadedSrc =
    imageState.storagePath === data.storagePath ? imageState.src : null;
  const src = data.objectUrl ?? downloadedSrc;
  const failed =
    !data.objectUrl &&
    (!data.storagePath ||
      (imageState.storagePath === data.storagePath && imageState.failed));

  return (
    <div className="relative h-full w-full bg-transparent">
      <NodeResizer
        isVisible={selected}
        keepAspectRatio
        minWidth={MIN_IMAGE_NODE_WIDTH}
        minHeight={MIN_IMAGE_NODE_HEIGHT}
        lineClassName="!border-primary/70"
        handleClassName="!h-3 !w-3 !rounded-full !border-2 !border-primary !bg-background"
      />
      {src ? (
        <img
          src={src}
          alt={data.alt}
          crossOrigin="anonymous"
          className="block h-full w-full select-none object-contain"
          draggable={false}
        />
      ) : (
        <div
          className={cn(
            "flex h-full min-h-12 w-full min-w-12 items-center justify-center rounded bg-muted/70 px-2 text-center text-xs text-muted-foreground",
            failed && "bg-destructive/15 text-destructive",
          )}
        >
          {failed ? t.pastedImageLoadFailed : t.pastedImageLoading}
        </div>
      )}
    </div>
  );
}

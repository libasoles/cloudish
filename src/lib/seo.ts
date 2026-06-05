const SITE_URL = "https://cloudish.com.ar";
const DEFAULT_IMAGE_URL = `${SITE_URL}/screenshots/app-canvas.png`;

type SeoMeta = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
};

function setMeta(selector: string, attribute: "content" | "href", value: string) {
  const element = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(
    selector,
  );

  if (element) {
    element.setAttribute(attribute, value);
    return;
  }

  const nextElement = selector.startsWith("link")
    ? document.createElement("link")
    : document.createElement("meta");

  const match = selector.match(/\[(name|property|rel)="([^"]+)"\]/);
  if (match) {
    nextElement.setAttribute(match[1], match[2]);
  }

  nextElement.setAttribute(attribute, value);
  document.head.appendChild(nextElement);
}

export function setSeoMeta({ title, description, path, type = "website" }: SeoMeta) {
  const url = `${SITE_URL}${path}`;

  document.title = title;
  setMeta('meta[name="description"]', "content", description);
  setMeta('meta[name="robots"]', "content", "index, follow");
  setMeta('link[rel="canonical"]', "href", url);
  setMeta('meta[property="og:type"]', "content", type);
  setMeta('meta[property="og:url"]', "content", url);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[property="og:image"]', "content", DEFAULT_IMAGE_URL);
  setMeta('meta[name="twitter:url"]', "content", url);
  setMeta('meta[name="twitter:title"]', "content", title);
  setMeta('meta[name="twitter:description"]', "content", description);
  setMeta('meta[name="twitter:image"]', "content", DEFAULT_IMAGE_URL);
}

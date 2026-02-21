import { API_CONFIG } from "@/constants/api";
import { CreatorProfile, PortfolioItem, Deliverable, Testimonial } from "@/types";

interface PublishPayload {
  username: string;
  profile: {
    name: string;
    bio: string;
    avatarUrl: string;
    contactEmail: string;
    availability: string;
    bookedUntil?: string;
    niches: string[];
    socialLinks: { id: string; platform: string; url: string }[];
    deliverables: Deliverable[];
    portfolio: { id: string; uri: string; category: string; brandName?: string; description?: string }[];
    testimonials: Testimonial[];
  };
}

interface UploadResult {
  success: boolean;
  url: string;
}

interface PublishResult {
  success: boolean;
  url: string;
  error?: string;
}

/**
 * Upload a single image to the web API
 */
export async function uploadImage(
  imageUri: string,
  username: string,
  type: "avatar" | "portfolio"
): Promise<UploadResult | null> {
  try {
    const formData = new FormData();

    // Get file extension
    const ext = imageUri.split(".").pop()?.toLowerCase() || "jpg";
    const mimeType = ext === "png" ? "image/png" : "image/jpeg";

    formData.append("file", {
      uri: imageUri,
      name: `${type}_${Date.now()}.${ext}`,
      type: mimeType,
    } as any);
    formData.append("username", username);
    formData.append("type", type);

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/upload`, {
      method: "POST",
      headers: {
        "x-api-key": API_CONFIG.API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error("Upload failed:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}

/**
 * Upload images that are local (file:// URIs) and return the remote URL.
 * If already a remote URL (https://), return as-is.
 */
async function resolveImageUrl(
  uri: string,
  username: string,
  type: "avatar" | "portfolio"
): Promise<string> {
  if (!uri) return "";
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;

  // Local file — upload it
  const result = await uploadImage(uri, username, type);
  return result?.url || "";
}

/**
 * Publish the full creator profile to the website
 */
export async function publishProfile(
  profile: CreatorProfile,
  portfolio: PortfolioItem[],
  deliverables: Deliverable[],
  testimonials: Testimonial[],
  onProgress?: (step: string) => void
): Promise<PublishResult> {
  try {
    const username = profile.username?.toLowerCase().replace(/[^a-z0-9_-]/g, "");

    if (!username) {
      return { success: false, url: "", error: "Please set a username in your profile first." };
    }

    if (!profile.contactEmail) {
      return { success: false, url: "", error: "Please add a contact email in your profile first." };
    }

    // Step 1: Upload avatar if local
    onProgress?.("Uploading avatar...");
    const avatarUrl = await resolveImageUrl(profile.avatarUrl || "", username, "avatar");

    // Step 2: Upload portfolio images if local
    onProgress?.("Uploading portfolio...");
    const resolvedPortfolio = await Promise.all(
      portfolio.map(async (item) => ({
        id: item.id,
        uri: await resolveImageUrl(item.uri, username, "portfolio"),
        category: item.category || "",
        brandName: item.brandName || "",
        description: item.description || "",
      }))
    );

    // Step 3: Publish profile data
    onProgress?.("Publishing profile...");
    const payload: PublishPayload = {
      username,
      profile: {
        name: profile.name || "",
        bio: profile.bio || "",
        avatarUrl,
        contactEmail: profile.contactEmail || "",
        availability: profile.availability || "available",
        bookedUntil: profile.bookedUntil,
        niches: profile.niches || [],
        socialLinks: profile.socialLinks || [],
        deliverables: deliverables.filter((d) => d.isActive),
        portfolio: resolvedPortfolio.filter((p) => p.uri),
        testimonials: testimonials || [],
      },
    };

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_CONFIG.API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      return { success: false, url: "", error: error.error || "Failed to publish" };
    }

    const data = await response.json();
    return {
      success: true,
      url: data.url || `https://ugcio.app/${username}`,
    };
  } catch (error: any) {
    console.error("Publish error:", error);
    return {
      success: false,
      url: "",
      error: error.message || "Network error. Please check your connection.",
    };
  }
}

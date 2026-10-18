import { Platform } from "react-native";

export const uploadToCloudinary = async (
  uri: string,
  folder: string
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", {
    uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
    type: "image/jpeg",
    name: "image.jpg",
  } as any);
  formData.append("upload_preset", "Social Page"); // Updated upload preset
  formData.append("folder", folder);

  try {
    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dwq87pglw/image/upload",
      {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error("Image upload failed");
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export default uploadToCloudinary;

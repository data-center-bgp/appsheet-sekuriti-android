import { supabase } from "../lib/supabase";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

export interface PhotoUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

export async function uploadPhotoToStorage(
  uri: string,
  fileName: string,
  bucket: string = "fotodokeluar"
): Promise<PhotoUploadResult> {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to blob
    const arrayBuffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error: any) {
    console.error("Photo upload error:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePhotoFromStorage(
  path: string,
  bucket: string = "fotodokeluar"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function pickImageFromGallery(): Promise<ImagePicker.ImagePickerResult> {
  const permissionResult =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (permissionResult.granted === false) {
    throw new Error("Permission to access gallery is required!");
  }

  return await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
}

export async function takePhoto(): Promise<ImagePicker.ImagePickerResult> {
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

  if (permissionResult.granted === false) {
    throw new Error("Permission to access camera is required!");
  }

  return await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
}

export function generatePhotoFileName(
  barangMasukId: string,
  index: number
): string {
  const timestamp = new Date().getTime();
  return `barang_masuk_${barangMasukId}_${index}_${timestamp}.jpg`;
}

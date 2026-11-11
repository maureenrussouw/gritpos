import { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Switch, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { Image } from "expo-image";
import { uploadLocalFile } from "@/lib/upload";
import { resolveImageUrl } from "@/lib/images";
import { ImagePickerSheet } from "@/components/ui/image-picker-sheet";
import { useCategories } from "@/hooks/use-categories";
import { RelationSelect } from "@/components/ui/relation-select";
import { formatNumberInput, parseNumberInput } from "@/lib/format";

export interface ProductFormProps {
  initial?: Record<string, any>;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
}

// Shared create/edit form. Renders inside a page or a bottom sheet; the parent
// owns the mutation and navigation via onSubmit.
export function ProductForm({ initial, onSubmit, submitting, submitLabel }: ProductFormProps) {
  const i: any = initial || {};
  const [error, setError] = useState("");
  const [name, setName] = useState(i.name ?? "");
  const [sku, setSku] = useState(i.sku ?? "");
  const [price, setPrice] = useState(i.price != null ? formatNumberInput(String(i.price), true) : "");
  const [stock, setStock] = useState(i.stock != null ? formatNumberInput(String(i.stock)) : "");
  const [categoryID, setCategoryID] = useState(i.category_id ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(i.thumbnail?.url ?? null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [imagesUrls, setImagesUrls] = useState<string[]>((i.images ?? []).map((x: any) => x?.url).filter(Boolean));
  const [imagesPreviews, setImagesPreviews] = useState<string[]>((i.images ?? []).map((x: any) => resolveImageUrl(x?.url)).filter(Boolean));
  const categoriesQuery = useCategories("", {}, "created_at", "desc", 500);
  const categoriesOpts = categoriesQuery.data?.pages.flatMap((p: any) => p.data) ?? [];
  const inputClass =
    "bg-white dark:bg-[#111118] border border-[#E5E7EB] dark:border-[#2a2a3a] rounded-2xl px-4 py-3.5 text-[#0F1018] dark:text-white text-[15px] mb-4";
  const labelClass = "text-[13px] font-semibold text-[#6B7280] dark:text-[#9090a8] mb-2";

  // One picker sheet serves every image field. openPicker aims it at the tapped
  // field (single or multi), we show the picked LOCAL images instantly, upload
  // them in the background, then hand back the stored URLs for the payload.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMultiple, setPickerMultiple] = useState(false);
  const [uploading, setUploading] = useState(false);
  const pickerTarget = useRef<{ onPreview: (uris: string[]) => void; onUploaded: (urls: string[]) => void } | null>(null);

  const openPicker = (
    multiple: boolean,
    onPreview: (uris: string[]) => void,
    onUploaded: (urls: string[]) => void,
  ) => {
    pickerTarget.current = { onPreview, onUploaded };
    setPickerMultiple(multiple);
    setPickerOpen(true);
  };

  const onImagesSelected = async (uris: string[]) => {
    setPickerOpen(false);
    const target = pickerTarget.current;
    if (!uris.length || !target) return;
    target.onPreview(uris);
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const uri of uris) {
        urls.push(await uploadLocalFile(uri));
      }
      target.onUploaded(urls);
    } catch (e: any) {
      Alert.alert("Upload failed", e.message || "Please try again");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setError("");
    if (!categoryID) return setError("Category is required");
    try {
      await onSubmit({
        name: name,
        sku: sku,
        price: parseNumberInput(price),
        stock: parseNumberInput(stock),
        category_id: categoryID,
        thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined,
        images: imagesUrls.map((u) => ({ url: u })),
      });
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    }
  };

  return (
    <View>
      {error ? (
        <View className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/25 rounded-2xl px-4 py-3 mb-4 flex-row items-center">
          <Ionicons name="alert-circle" size={18} color="#ff6b6b" />
          <Text className="text-[#ff6b6b] text-[13px] ml-2 flex-1">{error}</Text>
        </View>
      ) : null}

        <Text className={labelClass}>Name</Text>
        <TextInput className={inputClass} placeholder="Name" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />
        <Text className={labelClass}>Sku</Text>
        <TextInput className={inputClass} placeholder="Sku" placeholderTextColor="#9CA3AF" value={sku} onChangeText={setSku} />
        <Text className={labelClass}>Price</Text>
        <TextInput className={inputClass} placeholder="Price" placeholderTextColor="#9CA3AF" value={price} onChangeText={(t) => setPrice(formatNumberInput(t, true))} keyboardType="decimal-pad" />
        <Text className={labelClass}>Stock</Text>
        <TextInput className={inputClass} placeholder="Stock" placeholderTextColor="#9CA3AF" value={stock} onChangeText={(t) => setStock(formatNumberInput(t))} keyboardType="numeric" />
      <RelationSelect label="Category" value={categoryID} onChange={setCategoryID} options={categoriesOpts} />
      <Text className={labelClass}>Thumbnail</Text>
      <Pressable onPress={() => openPicker(false, (u) => setThumbnailPreview(u[0]), (urls) => setThumbnailUrl(urls[0]))} className="mb-4 h-40 rounded-2xl border border-dashed border-[#E5E7EB] dark:border-[#2a2a3a] items-center justify-center overflow-hidden bg-white dark:bg-[#111118]">
        {thumbnailPreview ? (
          <>
            <Image source={{ uri: thumbnailPreview }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            {uploading ? (
              <View className="absolute inset-0 items-center justify-center bg-black/30"><ActivityIndicator color="#fff" /></View>
            ) : null}
          </>
        ) : thumbnailUrl ? (
          <Image source={{ uri: resolveImageUrl(thumbnailUrl) }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <View className="items-center">
            <Ionicons name="image-outline" size={28} color="#9CA3AF" />
            <Text className="text-[#6B7280] dark:text-[#9090a8] mt-2 text-[13px]">Tap to add a photo</Text>
          </View>
        )}
      </Pressable>
      <Text className={labelClass}>Images</Text>
      <View className="flex-row flex-wrap mb-4">
        {imagesPreviews.map((uri, idx) => (
          <View key={idx} className="mr-2 mb-2">
            <Image source={{ uri }} style={{ width: 88, height: 88, borderRadius: 14 }} contentFit="cover" />
            <Pressable onPress={() => { setImagesPreviews((p) => p.filter((_, i) => i !== idx)); setImagesUrls((p) => p.filter((_, i) => i !== idx)); }} className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-black/70 items-center justify-center">
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
        <Pressable onPress={() => openPicker(true, (u) => setImagesPreviews((p) => [...p, ...u]), (urls) => setImagesUrls((p) => [...p, ...urls]))} className="w-[88px] h-[88px] rounded-2xl border border-dashed border-[#E5E7EB] dark:border-[#2a2a3a] items-center justify-center bg-white dark:bg-[#111118]">
          {uploading ? <ActivityIndicator color="#6c5ce7" /> : <Ionicons name="add" size={26} color="#9CA3AF" />}
        </Pressable>
      </View>
      <Pressable
        onPress={submit}
        disabled={submitting}
        className="bg-[#6c5ce7] rounded-full py-4 items-center mt-2"
        style={{ opacity: submitting ? 0.7 : 1 }}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-[15px]">{submitLabel || "Save"}</Text>
        )}
      </Pressable>
      <ImagePickerSheet visible={pickerOpen} multiple={pickerMultiple} onClose={() => setPickerOpen(false)} onSelect={onImagesSelected} />
    </View>
  );
}

import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { resolveImageUrl } from "@/lib/images";
import { relationLabel } from "@/lib/relation-label";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useTheme } from "@/lib/theme";
import { useProduct, useDeleteProduct } from "@/hooks/use-products";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View className="flex-row items-start justify-between px-5 py-4 border-b border-[#E5E7EB] dark:border-[#2a2a3a]">
      <Text className="text-[14px] text-[#6B7280] dark:text-[#9090a8]">{label}</Text>
      <Text
        className="text-[14px] text-[#0F1018] dark:text-white font-medium flex-1 text-right ml-4"
        numberOfLines={4}
      >
        {value === null || value === undefined || value === "" ? "—" : String(value)}
      </Text>
    </View>
  );
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette } = useTheme();
  const { data: item, isLoading } = useProduct(id);
  const del = useDeleteProduct();

  const onDelete = () => {
    Alert.alert("Delete product", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await del.mutateAsync(id);
            router.back();
          } catch (e: any) {
            Alert.alert("Delete failed", e.message || "Please try again");
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0a0a0f]">
      <ScreenHeader title="Product" showBack />
      {isLoading || !item ? (
        <ActivityIndicator color={palette.refresh} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
          {item.thumbnail?.url ? (
            <Image source={{ uri: resolveImageUrl(item.thumbnail?.url) }} style={{ width: "100%", height: 200, borderRadius: 20, marginBottom: 16 }} contentFit="cover" />
          ) : null}
          <Text className="text-[22px] font-bold text-[#0F1018] dark:text-white mb-4">
            {item.name ? String(item.name) : "Untitled"}
          </Text>
          <View className="bg-white dark:bg-[#111118] border border-[#E5E7EB] dark:border-[#1f1f2b] rounded-2xl overflow-hidden">
            <Row label="Name" value={item.name} />
            <Row label="Sku" value={item.sku} />
            <Row label="Price" value={item.price} />
            <Row label="Stock" value={item.stock} />
            <Row label="Category" value={relationLabel(item.category) || item.category_id} />
            <Row label="Thumbnail" value={item.thumbnail?.name || (item.thumbnail ? "1 file" : "—")} />
            <Row label="Images" value={item.images?.length ? item.images.length + " file(s)" : "—"} />
          </View>

          <Pressable
            onPress={() => router.push({ pathname: "/products/edit/[id]", params: { id } })}
            className="bg-[#6c5ce7] rounded-full py-4 items-center mt-6 flex-row justify-center"
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text className="text-white font-semibold text-[15px] ml-2">Edit</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-full py-4 items-center mt-3 flex-row justify-center"
          >
            <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
            <Text className="text-[#ff6b6b] font-semibold text-[15px] ml-2">Delete</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

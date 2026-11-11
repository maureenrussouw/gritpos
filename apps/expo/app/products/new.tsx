import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ui/screen-header";
import { ProductForm } from "@/components/resource-forms/products-form";
import { useCreateProduct } from "@/hooks/use-products";

export default function CreateProductScreen() {
  const router = useRouter();
  const create = useCreateProduct();
  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0a0a0f]">
      <ScreenHeader title="New Product" showBack />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <ProductForm
          submitting={create.isPending}
          submitLabel="Create Product"
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            router.back();
          }}
        />
      </ScrollView>
    </View>
  );
}

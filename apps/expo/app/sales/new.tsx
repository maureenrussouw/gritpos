import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SaleForm } from "@/components/resource-forms/sales-form";
import { useCreateSale } from "@/hooks/use-sales";

export default function CreateSaleScreen() {
  const router = useRouter();
  const create = useCreateSale();
  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0a0a0f]">
      <ScreenHeader title="New Sale" showBack />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <SaleForm
          submitting={create.isPending}
          submitLabel="Create Sale"
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            router.back();
          }}
        />
      </ScrollView>
    </View>
  );
}

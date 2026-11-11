import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SupplierForm } from "@/components/resource-forms/suppliers-form";
import { useCreateSupplier } from "@/hooks/use-suppliers";

export default function CreateSupplierScreen() {
  const router = useRouter();
  const create = useCreateSupplier();
  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0a0a0f]">
      <ScreenHeader title="New Supplier" showBack />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <SupplierForm
          submitting={create.isPending}
          submitLabel="Create Supplier"
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            router.back();
          }}
        />
      </ScrollView>
    </View>
  );
}

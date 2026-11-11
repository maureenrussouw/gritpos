import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ui/screen-header";
import { CategoryForm } from "@/components/resource-forms/categories-form";
import { useCreateCategory } from "@/hooks/use-categories";

export default function CreateCategoryScreen() {
  const router = useRouter();
  const create = useCreateCategory();
  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0a0a0f]">
      <ScreenHeader title="New Category" showBack />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <CategoryForm
          submitting={create.isPending}
          submitLabel="Create Category"
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            router.back();
          }}
        />
      </ScrollView>
    </View>
  );
}
